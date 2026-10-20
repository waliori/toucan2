{
  description = "Toucan2 halves ZMK firmware: Walid layout, accent prefix, Studio, live key feed, Prospector status advertisement";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    zmk-nix = {
      url = "github:lilyinstarlight/zmk-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, zmk-nix }: let
    forAllSystems = nixpkgs.lib.genAttrs (nixpkgs.lib.attrNames zmk-nix.packages);
  in {
    packages = forAllSystems (system: rec {
      default = firmware;

      # nix build  ->  result/zmk_left.uf2, result/zmk_right.uf2 (flash these) and result/zmk_reset.uf2 (settings reset)
      firmware = zmk-nix.legacyPackages.${system}.buildSplitKeyboard {
        name = "toucan2-firmware";
        src = nixpkgs.lib.sourceFilesBySuffices self [ ".board" ".c" ".cmake" "CMakeLists.txt" "Kconfig" ".conf" ".defconfig" ".dts" ".dtsi" ".json" ".keymap" ".overlay" ".shield" ".yml" "_defconfig" ];

        board = "seeeduino_xiao_ble";
        parts = [ "left" "right" "reset" ];
        centralPart = "left";
        shield = {
          left = "toucan_left rgbled_adapter nice_view_gem key_feed";
          right = "toucan_right rgbled_adapter";
          reset = "settings_reset";
        };
        enableZmkStudio = true;
        # ZMK v0.3 predates GCC 14's int-conversion errors; keep them warnings
        extraCmakeFlags = [ "-DEXTRA_CFLAGS=-Wno-error=int-conversion -Wno-error=implicit-function-declaration -Wno-error=incompatible-pointer-types" ];
        # nanopb's generator (Studio protobufs) still imports pkg_resources, gone from setuptools >= 81; shim its one call
        postConfigure = ''
          for f in ../modules/lib/nanopb/generator/proto/__init__.py ../modules/lib/nanopb/generator/proto/_utils.py; do
            sed -i 's/^\( *\)import pkg_resources$/\1class pkg_resources:\n\1    @staticmethod\n\1    def resource_filename(p, n):\n\1        import importlib.util as iu, os.path as op\n\1        return op.join(op.dirname(iu.find_spec(p).origin), n)/' "$f"
          done
        '';

        zephyrDepsHash = "sha256-eyVaO5Dh+Xl4EBk5bBqNbgzrafo9hsF9UtDNjK+RCx0=";

        meta = {
          description = "Toucan2 halves firmware";
          license = nixpkgs.lib.licenses.mit;
          platforms = nixpkgs.lib.platforms.all;
        };
      };

      flash = zmk-nix.packages.${system}.flash.override { inherit firmware; };
      update = zmk-nix.packages.${system}.update;
    });

    devShells = forAllSystems (system: {
      default = zmk-nix.devShells.${system}.default;
    });
  };
}
