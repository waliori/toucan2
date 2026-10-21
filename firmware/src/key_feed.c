// Live key feed for trainer/: one line per key position press/release and per layer on/off,
// written straight to a dedicated USB CDC ACM port (feed_uart in boards/shields/key_feed).
// No Zephyr logging involved: lines are only written while a host has the port open (DTR set),
// and the CDC driver never blocks (it drops when its ring buffer is full), so the feed cannot
// stall the Bluetooth stack when nobody is listening or the cable is out.
// Line format (same as the old log-based feed): "feed: K <position> <1|0>", "feed: L <layer> <1|0>".
#include <stdio.h>
#include <zephyr/device.h>
#include <zephyr/drivers/uart.h>
#include <zephyr/kernel.h>
#include <zmk/event_manager.h>
#include <zmk/events/layer_state_changed.h>
#include <zmk/events/position_state_changed.h>

static const struct device *const feed = DEVICE_DT_GET(DT_NODELABEL(feed_uart));

static void emit(char kind, uint32_t n, bool on) {
    uint32_t dtr = 0;
    char line[24];
    if (!device_is_ready(feed) || uart_line_ctrl_get(feed, UART_LINE_CTRL_DTR, &dtr) || !dtr) {
        return;   // nobody listening
    }
    int len = snprintf(line, sizeof line, "feed: %c %u %d\n", kind, n, on ? 1 : 0);
    uart_fifo_fill(feed, (const uint8_t *)line, len);
}

static int feed_listener(const zmk_event_t *eh) {
    const struct zmk_position_state_changed *p = as_zmk_position_state_changed(eh);
    if (p) {
        emit('K', p->position, p->state);
        return ZMK_EV_EVENT_BUBBLE;
    }
    const struct zmk_layer_state_changed *l = as_zmk_layer_state_changed(eh);
    if (l) {
        emit('L', l->layer, l->state);
    }
    return ZMK_EV_EVENT_BUBBLE;
}

ZMK_LISTENER(feed, feed_listener);
ZMK_SUBSCRIPTION(feed, zmk_position_state_changed);
ZMK_SUBSCRIPTION(feed, zmk_layer_state_changed);
