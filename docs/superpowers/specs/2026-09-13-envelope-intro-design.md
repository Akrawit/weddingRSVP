# Envelope intro design

The invitation opens with a cream envelope carrying `เรียน {guest.display_name}` in Thai or `To {guest.display_name}` in English. The envelope uses CSS shapes and the site's existing colors and typography. The flap opens and a card rises briefly; the full invitation is then available after about 2.2 seconds. Tapping the intro enters immediately.

The guest name comes from the same guest object used by the invitation. This feature does not alter the RSVP or invitation URL. A reduced-motion preference skips the intro automatically. It is a single button so keyboard users can activate it with Enter or Space.

Acceptance: the correct guest name is visible, the intro dismisses automatically or immediately on activation, no persistent overlay remains, and the RSVP remains usable on mobile and desktop.
