{
  description = "Prospector as a ZMK status scanner (listens to the Toucan2's status advertisements; not a split central)";

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

      # nix build  ->  result/zmk_scanner.uf2 (flash this) and result/zmk_reset.uf2 (settings reset)
      firmware = zmk-nix.legacyPackages.${system}.buildSplitKeyboard {
        name = "prospector-scanner";
        src = nixpkgs.lib.sourceFilesBySuffices self [ ".conf" ".keymap" ".yml" ];

        board = "xiao_ble/nrf52840/zmk";
        parts = [ "scanner" "reset" ];
        centralPart = "scanner";
        shield = {
          scanner = "prospector_scanner";
          reset = "settings_reset";
        };

        zephyrDepsHash = "sha256-hzB7KvPrh09BEuQRQ/1JjF9ANLoypJKoegUFl5ZQ1YQ=";

        meta = {
          description = "Prospector scanner firmware";
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
