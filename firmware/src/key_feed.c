// Live key feed: every key position press/release and layer on/off seen by the central
// is written as one line on the USB logging port, so a host app (trainer/) can mirror
// the board in real time. Format inside the Zephyr log line: "K <position> <1|0>" and "L <layer> <1|0>".
#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zmk/event_manager.h>
#include <zmk/events/position_state_changed.h>
#include <zmk/events/layer_state_changed.h>

LOG_MODULE_REGISTER(feed, LOG_LEVEL_INF);

static int feed_listener(const zmk_event_t *eh) {
    const struct zmk_position_state_changed *p = as_zmk_position_state_changed(eh);
    if (p) {
        LOG_INF("K %u %d", p->position, p->state ? 1 : 0);
        return ZMK_EV_EVENT_BUBBLE;
    }
    const struct zmk_layer_state_changed *l = as_zmk_layer_state_changed(eh);
    if (l) {
        LOG_INF("L %u %d", l->layer, l->state ? 1 : 0);
    }
    return ZMK_EV_EVENT_BUBBLE;
}

ZMK_LISTENER(feed, feed_listener);
ZMK_SUBSCRIPTION(feed, zmk_position_state_changed);
ZMK_SUBSCRIPTION(feed, zmk_layer_state_changed);
