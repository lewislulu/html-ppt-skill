# -*- coding: utf-8 -*-
"""
DMart x Pause Point - 10-slide marketing pitch.
Single source of truth: tokens + per-slide geometry, written against a
13.333 x 7.5 in (16:9) canvas. Consumed by build.py, which renders it three
ways: .pptx (deliverable), .html (preview) and .png (QA).

Design language (html-ppt skill -> native pptx translation):
  * fixed canvas, 0.85 in side margins, one shared header/footer grid
  * axis-aligned primitives only; type: Trebuchet MS display / Calibri body
  * colour: DMart green #046D39 + brand cream #F7E1B5, hairlines, flat cards
  * every slide = 1 headline that states the takeaway + max 3 supporting
    points + 1 visual or data element
Facts come only from "HCD module, FMCG, Group 7" (28 pp.). Missing numbers are
marked [NEEDED] and never invented.

Vertical rhythm (shared by all 10 slides)
  0.52 kicker · 0.90 rule · 1.02 headline (<=2 lines) · 2.34 body · 6.40 end
  7.12 footer · 7.445 progress bar
"""

# ---------------------------------------------------------------- tokens
INK      = "0B1F17"   # near-black green, headline ink
INK_2    = "3F4F47"   # secondary body text
MUTED    = "6E7C74"   # captions
GREEN    = "046D39"   # DMart green
GREEN_D  = "03542C"
MINT     = "EAF1EB"   # pale green wash
MINT_2   = "F4F7F4"
CREAM    = "F7E1B5"   # DMart brand cream
CREAM_2  = "FBEFD6"
ALARM    = "B4401E"   # only ever marks today's pain / a gap
LINE     = "DCE4DD"
WHITE    = "FFFFFF"

HEAD = "head"   # font role -> Trebuchet MS
BODY = "body"   # font role -> Calibri

# type scale (pt)
S_COVER, S_H1, S_LEAD = 44, 26, 14.5
S_KICK, S_PT_T, S_BODY, S_CARD_T = 8.5, 10, 10.8, 11.5
S_TABLE, S_MICRO, S_NUM = 10.2, 8, 26

# grid (in)
M   = 0.85
W   = 13.333 - 2 * M            # 11.633
COL_L_W = 6.40
COL_R_X = 7.90
COL_R_W = W - (COL_R_X - M)     # 4.583
Y_HEAD  = 1.02
Y_BODY  = 2.34
Y_END   = 6.40

SLIDE_TITLES = ["Hook", "Problem", "Insight", "Ideation", "Prototype",
                "Product", "Key functions", "Design", "Measurement", "Ask"]

NOTES = [
    "Open on the shopper, not the product. By the time she reaches billing she has been on her feet for "
    "over an hour, and 75% of the shoppers we surveyed said there is nowhere to sit. That is the moment "
    "the list stops mattering — they just want to bill and exit. Hold the three numbers up and then move "
    "straight into what that costs DMart.",
    "Make it physical and specific. This is not “poor experience”, it is back pain, queues and older "
    "shoppers sitting on the stairs, at exactly the point where the basket stops growing. And it is not "
    "only comfort: our empathy map has shoppers asking whether to just order on quick commerce instead. "
    "Tired trips leak baskets.",
    "Here is the turn. We are not asking for floor space or a new fixture — every shopper is already "
    "holding a surface she can rest on, and it travels with her to the counter. Say the reframe out loud: "
    "the seat area loses the aisle argument, the trolley wins it. That is why this is cheap enough to try.",
    "Walk the three cuts quickly: eight staff roles down to shoppers, four problems down to one, two "
    "routes down to the trolley. Then land on the four gates — the point is that the idea survived "
    "constraints, not that we fell in love with it. Cut the seat area, keep the paddle.",
    "Be honest about where the prototype stands: hand mock-up, Blender model, mechanism POC. One hard "
    "failure — pushing back on the seat pushed the cart forward — and the fix that came out of it: a wheel "
    "brake. Flag the trial-data gap before they find it; it buys credibility for the pilot ask.",
    "One sentence, then the mechanism in three moves: fold, lock, stow. If they remember only one slide, "
    "make it this one. No screens, no app, no attendant — the whole interaction is one hand and no help. Point at the schematic and name the two dimensions that matter: 1.5–2 inches high, 8–9 wide.",
    "Every row is a store constraint, not a wish list, and none of them asks DMart for floor space. Read "
    "the right-hand column as the business case: a rested shopper keeps shopping, the seat cleans like the "
    "floor does, and no aisle gets narrower. Keep the benefit column honest — the pilot proves the size.",
    "Show where the pause lands in the journey: it is not a new step, it is the step she already takes and "
    "cannot finish. PAUSE and CHECK OUT are the two red dots. The four principles at the bottom are the "
    "same four gates from ideation — design discipline, repeated, not reinvented.",
    "Be straight: we hold one baseline from our own 50-shopper survey, and DMart holds the four that "
    "matter. Ask for those four in week one, then read them weekly against a matched control store. If the "
    "delta is not there, the pilot has still told us something useful.",
    "Close on a decision, not a budget request: one store, two named owners, four baselines. Store, dates, "
    "pilot length, unit counts and cost are theirs to set at kickoff — we left them blank rather than invent numbers for "
    "their P&L. Then shut up and let them answer.",
]


def build(S):
    slides = []

    # ============================================================= 01 HOOK
    s = S(1, "cover")
    s.rect(0, 0, 13.333, 7.5, GREEN)
    s.text(M, 0.62, 8.6, 0.22, _p("FOR DMART  ·  AVENUE SUPERMARTS  ·  MARKETING PROPOSAL",
                                  S_KICK, CREAM, bold=True, track=0.22))
    s.rect(M, 1.32, 1.15, 0.045, CREAM)
    s.text(M, 1.62, 10.9, 1.95,
           _p("The last hour of the shop\nis the hour DMart loses.", S_COVER, WHITE,
              bold=True, font=HEAD, ls=1.02))
    s.text(M, 3.92, 9.4, 0.85,
           _p("Shoppers tell us they reach a point where they “just want to bill and exit” — with items "
              "still on the list.", S_LEAD, CREAM, ls=1.35))
    s.rect(M, 5.26, W, 0.010, "1E7A4C")
    for i, (big, lab) in enumerate([
            ("75%", "say there is nowhere to sit in an FMCG store"),
            ("1.5–2 hrs", "in store, arrival to billing"),
            ("≈50", "shoppers surveyed, plus 8 store roles")]):
        x = M + i * (W / 3)
        s.text(x, 5.54, 3.5, 0.52, _p(big, 29, WHITE, bold=True, font=HEAD, ls=1.0))
        s.text(x, 6.14, 3.30, 0.55, _p(lab, 9.2, CREAM, ls=1.32))
    s.text(M, 7.06, 6.0, 0.2, _p("GROUP 7  ·  HCD MODULE, SEM 3", 7.5, "CFBB8C",
                                 bold=True, track=0.18))
    s.progress(1, dark=True)
    slides.append(s)

    # ========================================================== 02 PROBLEM
    s = S(2, "problem")
    s.chrome("02 — THE PROBLEM", 2)
    s.head("Shoppers don’t run out of list.\nThey run out of legs — at the counter.")
    _points(s, [
        ("01  NOWHERE TO STOP",
         "There is no resting point anywhere on the floor. Older shoppers end up sitting on the stairs, "
         "on shelves, on the lift."),
        ("02  THE WORST MOMENT",
         "Fatigue starts about an hour in — exactly at the last list check and the billing line, where "
         "the crowd is at its worst."),
        ("03  THE COST TO THE BASKET",
         "Our empathy map has shoppers asking “should I just Blinkit things?”. A tired trip hands the "
         "easy basket to someone else."),
    ])
    s.rect(COL_R_X, Y_BODY, COL_R_W, Y_END - Y_BODY, MINT_2)
    s.rect(COL_R_X, Y_BODY, 0.05, Y_END - Y_BODY, GREEN)
    x0 = COL_R_X + 0.38
    xw = COL_R_W - 0.80
    s.text(x0, 2.66, 3.4, 0.85, _p("75%", 56, GREEN, bold=True, font=HEAD, ls=1.0))
    s.text(x0 + 0.02, 3.60, xw, 0.80,
           _p("of shoppers say there is no resting or sitting place in an FMCG store.", 11.5, INK,
              ls=1.30))
    s.rect(x0 + 0.02, 4.56, xw, 0.10, "D7E3D9")
    s.rect(x0 + 0.02, 4.56, xw * 0.75, 0.10, GREEN)
    s.text(x0 + 0.02, 4.74, xw, 0.24, _p("75 of 100 say they have nowhere to sit", 8.5, MUTED, ls=1.2))
    s.rect(x0 + 0.02, 5.16, xw, 0.008, "CDBBA2")
    s.text(x0 + 0.02, 5.28, xw, 0.55,
           _p("n ≈ 50 survey responses from college, family and relatives · primary research, "
              "HCD module", 8, MUTED, ls=1.30))
    slides.append(s)

    # ========================================================== 03 INSIGHT
    s = S(3, "insight")
    s.chrome("03 — THE INSIGHT", 3)
    s.head("They already lean on the trolley.\nSo we made the trolley the seat.")
    _points(s, [
        ("01  A SEAT AREA LOSES THE ARGUMENT",
         "Fixed seating eats the aisle space the store does not have, and crowds a billing zone that is "
         "already tight."),
        ("02  THE TROLLEY IS ALREADY THE REST POINT",
         "Shoppers rest on trolleys, shelves, the lift and the stairs. The trolley is the only one that "
         "travels the whole trip with them."),
        ("03  SO THE FIX COSTS NO FLOOR SPACE",
         "No new aisle, no new staff, no new habit — a seat on the cart she is already holding."),
    ])
    s.rect(COL_R_X, Y_BODY, COL_R_W, Y_END - Y_BODY, MINT_2)
    x0, xw = COL_R_X + 0.40, COL_R_W - 0.80
    s.text(x0, 2.56, xw, 0.22, _p("THE REFRAME", 8, GREEN_D, bold=True, track=0.14))
    s.text(x0, 2.88, xw, 0.34, _p("Add a seating area", 13, MUTED, bold=True, font=HEAD, ls=1.15))
    s.text(x0, 3.22, xw, 0.60, _p("Costs aisle space in the busiest zone of the store.", 9.8,
                                  MUTED, ls=1.30))
    s.tri(x0, 3.86, 0.16, 0.13, "BFC3B8", "down")
    s.text(x0 + 0.02, 4.18, xw, 0.34,
           _p("Put the seat on the trolley", 13, GREEN_D, bold=True, font=HEAD, ls=1.15))
    s.text(x0 + 0.02, 4.52, xw, 0.60,
           _p("Costs nothing in floor space, and it moves with the shopper.", 9.8, INK_2, ls=1.30))
    s.rect(x0, 5.22, xw, 0.008, "D7E3D9")
    s.text(x0, 5.34, xw, 0.80,
           _p("From our in-store observation and empathy map: anything that takes their weight for a "
              "minute becomes a seat.", 8.6, MUTED, ls=1.32))
    slides.append(s)

    # ========================================================= 04 IDEATION
    s = S(4, "ideation")
    s.chrome("04 — IDEATION", 4)
    s.head("Four problems, three cuts, one idea that survives a DMart aisle.")
    cols = [
        ("8 → 1", "WHOSE PROBLEM?",
         "Eight staff roles on the floor, but no primary access to staff or retail chains. We took the "
         "shopper’s side."),
        ("4 → 1", "WHICH PROBLEM?",
         "No seating · loose-grain bags · trolley condition · high shelves. No seating won: back pain, "
         "tired trips, queue complaints, older shoppers on the stairs."),
        ("2 → 1", "WHICH ROUTE?",
         "A fixed seating area, or a rest point on the trolley. The seat area loses aisle space; the "
         "trolley route passes every gate."),
        ("1", "WHICH MECHANISM?",
         "A fold-out paddle under the trolley bar with a wheel brake — the version that survived two "
         "mechanism POCs."),
    ]
    cw = (W - 3 * 0.24) / 4
    for i, (num, lab, body) in enumerate(cols):
        x = M + i * (cw + 0.24)
        s.rect(x, 2.30, cw, 2.62, MINT_2 if i < 3 else GREEN)
        s.text(x + 0.24, 2.50, cw - 0.48, 0.5,
               _p(num, S_NUM, GREEN if i < 3 else CREAM, bold=True, font=HEAD, ls=1.0))
        s.text(x + 0.24, 3.02, cw - 0.48, 0.22,
               _p(lab, 8, INK if i < 3 else CREAM, bold=True, track=0.14))
        s.text(x + 0.24, 3.32, cw - 0.44, 1.66,
               _p(body, 9.5, INK_2 if i < 3 else "DCEADF", ls=1.30))
    s.text(M, 5.34, W, 0.22,
           _p("EVERY IDEA HAD TO PASS FOUR GATES BEFORE WE BUILT IT", 8, GREEN_D, bold=True,
              track=0.14))
    gates = ["Independence — folds, no help needed", "Supports the body",
             "No queue, exit or aisle obstruction", "Durable and daily-cleanable"]
    gw = (W - 3 * 0.18) / 4
    for i, g in enumerate(gates):
        x = M + i * (gw + 0.18)
        s.rect(x, 5.68, gw, 0.66, WHITE, line=LINE)
        s.text(x + 0.18, 5.81, gw - 0.32, 0.42, _p(g, 9, INK, ls=1.26))
    slides.append(s)

    # ======================================================== 05 PROTOTYPE
    s = S(5, "prototype")
    s.chrome("05 — PROTOTYPE", 5)
    s.head("The first build failed on one force — so the brake became part of the product.")
    _points(s, [
        ("01  THREE BUILDS, EACH CLOSER",
         "Hand mock-up, then Blender models, then mechanism proofs — built around real bodies, not a "
         "pretty render."),
        ("02  THE FAILURE THAT SHAPED IT",
         "Pushing back on the seat pushes the cart forward. The answer is now a wheel brake: it locks the "
         "cart and carries the user’s weight."),
        ("03  DAILY USE SET THE MATERIALS",
         "Heat-, water- and weather-proof, wipe-clean and recyclable — spec’d for a store floor, not a "
         "showroom."),
    ])
    s.rect(COL_R_X, Y_BODY, COL_R_W, Y_END - Y_BODY, MINT_2)
    s.rect(COL_R_X, Y_BODY, COL_R_W, 0.05, GREEN)
    x0, xw = COL_R_X + 0.38, COL_R_W - 0.76
    s.text(x0, 2.54, xw, 0.22, _p("PROTOTYPE ENVELOPE", 8, GREEN_D, bold=True, track=0.14))
    for i, (v, k) in enumerate([("1.5–2 in", "seat height"), ("10–12 in", "seat length"),
                                ("8–9 in", "seat width")]):
        y = 2.86 + i * 0.56
        s.text(x0, y, 1.65, 0.3, _p(v, 14.5, GREEN_D, bold=True, font=HEAD, ls=1.0))
        s.text(x0 + 1.95, y + 0.05, 1.9, 0.28, _p(k, 9.2, MUTED, ls=1.1))
        s.rect(x0, y + 0.40, xw, 0.008, LINE)
    s.text(x0, 4.60, xw, 0.66,
           _p("Coconut fibre or firm high-density PU foam core · silicone or TPU cover · recyclable "
              "plastic paddle · rounded, wipe-clean edges.", 9.0, INK_2, ls=1.30))
    s.rect(x0, 5.36, xw, 0.008, "CDBBA2")
    s.text(x0, 5.46, xw, 0.72,
           _p("Tested so far: mechanism POC only. Structured user trial, load rating and a durability "
              "cycle are [NEEDED].", 9.0, ALARM, ls=1.30))
    slides.append(s)

    # ========================================================== 06 PRODUCT
    s = S(6, "product")
    s.chrome("06 — THE PRODUCT", 6)
    s.head("Pause Point: a fold-out seat on the trolley, so a tired shopper can finish the trip.")
    s.text(M, 2.30, COL_L_W - 0.25, 0.80,
           _p("A low, firm seat that folds out of the trolley’s lower bar and locks the wheels — a "
              "short rest in the aisle or the queue, without letting go of the basket.",
              13.5, INK_2, ls=1.34))
    _points(s, [
        ("01  FOLD", "One hand, no attendant. The paddle drops from the lower bar to a 1.5–2 in seat."),
        ("02  LOCK AND SIT", "The brake holds the wheels, so her weight stays on the seat and the cart "
                             "stays put."),
        ("03  STOW", "Sit out the queue, fold it flat, pay, walk out. Nothing to hand back."),
    ], y0=3.46, h=0.84, gap=0.14)
    # --- schematic: trolley, side elevation, axis-aligned
    s.rect(COL_R_X, Y_BODY, COL_R_W, 3.96, MINT_2)
    s.rect(COL_R_X, Y_BODY, COL_R_W, 0.05, GREEN)
    x0, xw = COL_R_X + 0.40, COL_R_W - 0.80
    s.text(x0, 2.54, xw, 0.22, _p("TROLLEY, SIDE VIEW  ·  NOT TO SCALE", 8, GREEN_D,
                                  bold=True, track=0.14))
    bx, by, bw, bh = 8.34, 3.06, 2.20, 0.80            # basket body
    s.rect(bx + 0.40, 2.72, 0.05, 0.34, GREEN_D)       # handle post
    s.rect(bx + 0.14, 2.66, 0.57, 0.07, GREEN_D)       # handle grip
    s.rect(bx, by, bw, bh, WHITE, line=GREEN_D, lw=1.3)
    s.rect(bx, by + 0.32, bw, 0.013, "D7E3D9")         # basket floor
    rail = by + bh + 0.24
    s.rect(bx + 0.14, rail, bw - 0.40, 0.030, "C9D4CC")   # lower bar
    for wx in (bx + 0.50, bx + bw - 0.44):
        s.oval(wx - 0.115, rail - 0.03, 0.23, 0.23, WHITE, line=GREEN, lw=1.4)
        s.oval(wx - 0.038, rail + 0.045, 0.076, 0.076, GREEN)
    hinge = bx + bw - 0.26
    s.rect(hinge - 0.05, rail - 0.05, 0.10, 0.11, GREEN_D)
    s.rect(hinge + 0.05, rail - 0.19, 1.05, 0.125, CREAM, line=GREEN_D, lw=1.1)   # paddle
    s.text(hinge + 1.14, rail - 0.185, 0.72, 0.20,
           _p("1.5–2 IN", 6.6, GREEN_D, bold=True, track=0.08))
    ly = 4.58
    s.rect(x0, ly + 0.05, 0.11, 0.11, GREEN)
    s.text(x0 + 0.19, ly, 1.45, 0.22, _p("WHEEL BRAKE", 7.2, GREEN_D, bold=True, track=0.10))
    s.rect(x0 + 1.72, ly + 0.055, 0.20, 0.10, CREAM, line=GREEN_D, lw=0.9)
    s.text(x0 + 2.00, ly, 1.55, 0.22, _p("FOLD-OUT PADDLE", 7.2, GREEN_D, bold=True, track=0.10))
    s.text(x0, 4.86, xw, 0.24, _p("SEAT 8–9 IN WIDE  ×  10–12 IN LONG", 7.8, INK, bold=True,
                                  track=0.10))
    s.text(x0, 5.14, xw, 0.62,
           _p("Stowed, the paddle sits under the lower bar: the aisle keeps its width and the queue "
              "keeps moving.", 9.0, INK_2, ls=1.32))
    s.rect(x0, 5.74, xw, 0.008, "D7E3D9")
    s.text(x0, 5.82, xw, 0.20, _p("Dimensions from the prototype envelope", 7.6, MUTED, ls=1.2))
    slides.append(s)

    # ======================================================= 07 FUNCTIONS
    s = S(7, "functions")
    s.chrome("07 — KEY FUNCTIONS", 7)
    s.head("Five features, five problems solved — and not one of them needs floor space.")
    rows = [
        ("Fold-out rest paddle", "A seat wherever the trip runs long — 1.5 to 2 hours in our personas",
         "Keeps a tired shopper in the basket instead of at the exit"),
        ("Wheel-brake lock", "The cart cannot roll while she sits",
         "Safe to sit exactly where the problem is worst — the queue"),
        ("Wipe-clean TPU or silicone cover, PU foam core",
         "A shared surface that cleans like the rest of the store",
         "Drops into the existing daily cleaning round"),
        ("8–9 in wide × 10–12 in long, low profile", "Two shoppers still pass in the aisle; the queue still moves",
         "No floor space, no aisle widening, no fixture spend"),
        ("Recyclable plastic paddle, heat- and water-proof build", "Survives a hot, wet, high-traffic store",
         "One part, one owner, a long service life"),
    ]
    _table(s, 2.20,
           [("FEATURE", M, 2.70), ("FOR THE SHOPPER", M + 2.92, 4.26), ("WHY DMART CARES", M + 7.44, 4.19)],
           rows, row_h=0.80)
    slides.append(s)

    # =========================================================== 08 DESIGN
    s = S(8, "design")
    s.chrome("08 — DESIGN", 8)
    s.head("One pause, placed exactly where the trip breaks.")
    stops = [("ARRIVE", "find a trolley", "ready", False),
             ("BROWSE", "find and collect items", "engaged", False),
             ("PAUSE", "look for a seat", "frustrated", True),
             ("CHECK OUT", "wait in line", "tired", True),
             ("LEAVE", "billing and exit", "eager to exit", False)]
    seg = W / 5
    s.rect(M, 3.06, W, 0.020, LINE)
    for i, (name, sub, state, pain) in enumerate(stops):
        cx = M + i * seg
        s.text(cx, 2.46, seg - 0.2, 0.22, _p(name, 8.5, INK, bold=True, track=0.12))
        s.oval(cx, 2.97, 0.19, 0.19, WHITE, line=ALARM if pain else GREEN, lw=1.6)
        if pain:
            s.oval(cx + 0.045, 3.015, 0.10, 0.10, ALARM)
        s.text(cx, 3.32, seg - 0.2, 0.24, _p(sub, 9.2, MUTED, ls=1.1))
        s.text(cx, 3.60, seg - 0.2, 0.30,
               _p(state.upper() if pain else state, 8.4 if pain else 9.2,
                  ALARM if pain else MUTED, bold=pain, ls=1.1))
    s.rect(M + 2 * seg, 4.02, seg, 0.40, GREEN)
    s.text(M + 2 * seg + 0.16, 4.12, seg - 0.28, 0.24, _p("PAUSE POINT FITS HERE", 7.6, WHITE,
                                                       bold=True, track=0.10))
    s.rect(M + 3 * seg, 4.02, seg, 0.40, GREEN)
    s.text(M + 3 * seg + 0.16, 4.12, seg - 0.28, 0.24, _p("AND HERE, IN THE QUEUE", 7.6, WHITE,
                                                       bold=True, track=0.10))
    moments = [("FOLD OUT", "One hand, mid-aisle or in the line."),
               ("LOCK AND SIT", "Sit as long as she needs; the basket stays beside her."),
               ("STOW", "Flat, no hand-back, no queue jump.")]
    mw = (W - 2 * 0.55) / 3
    for i, (t, b) in enumerate(moments):
        x = M + i * (mw + 0.55)
        s.text(x, 4.92, mw, 0.22, _p("0%d" % (i + 1), 9, GREEN, bold=True, track=0.12))
        s.text(x, 5.18, mw, 0.26, _p(t, 11, INK, bold=True, track=0.05))
        s.text(x, 5.50, mw, 0.55, _p(b, 10.2, INK_2, ls=1.30))
    s.rect(M, 6.28, W, 0.008, LINE)
    s.text(M, 6.40, W, 0.22,
           _p("DESIGN PRINCIPLES HELD  ·  INDEPENDENCE  ·  BODY SUPPORT  ·  NO OBSTRUCTION  ·  "
              "DURABLE AND DAILY-CLEANABLE", 8, GREEN_D, bold=True, track=0.12))
    slides.append(s)

    # ==================================================== 09 MEASUREMENT
    s = S(9, "measure")
    s.chrome("09 — MEASUREMENT", 9)
    s.head("The pilot answers one question: does a rested shopper spend more?")
    rows = [
        ("Footfall", "[NEEDED] — DMart", "[NEEDED]", "Entry counts, same day-part, pilot vs control store",
         "Weekly"),
        ("Basket size", "[NEEDED] — DMart", "[NEEDED]", "Value and items per transaction at POS", "Weekly"),
        ("Repeat rate", "[NEEDED] — DMart", "[NEEDED]", "Returning shoppers per store, month on month",
         "Monthly"),
        ("Campaign ROI", "[NEEDED] — DMart", "[NEEDED]", "Pilot cost against incremental basket value",
         "End of pilot"),
        ("Rested-shopper share", "75% say nowhere to sit (n ≈ 50, our survey)", "[NEEDED]",
         "Exit survey: day 0, day 45, day 90", "3 reads"),
    ]
    _table(s, 2.16,
           [("KPI", M, 1.98), ("BASELINE TODAY", M + 2.08, 2.55), ("TARGET", M + 4.76, 1.50),
            ("HOW WE READ IT", M + 6.38, 3.35), ("CADENCE", M + 9.85, 1.78)],
           rows, row_h=0.72, size=9.3)
    s.text(M, 6.30, W, 0.55,
           _p("Every DMart baseline and target is [NEEDED]: set with your team in week 1, then read weekly "
              "against a matched control store. We won’t guess your P&L.", 9.2, INK_2, ls=1.30))
    slides.append(s)

    # ============================================================ 10 ASK
    s = S(10, "ask")
    s.chrome("10 — THE ASK", 10)
    s.head("Give us one store and the four baselines; let the shoppers settle the argument.")
    asks = [
        ("1", "APPROVE THE PILOT",
         "One store, and the seat fitted to the trolleys already on the floor — no new fleet. Store, "
         "unit count, pilot length and dates: [NEEDED]."),
        ("2", "OPEN THE FOUR BASELINES",
         "Footfall, basket size, repeat rate, campaign ROI — all [NEEDED]. We report deltas, not "
         "opinions."),
        ("3", "NAME TWO OWNERS",
         "One store manager for fitting and the daily read, one cleaning lead for upkeep."),
    ]
    cw = (W - 2 * 0.26) / 3
    for i, (n, t, b) in enumerate(asks):
        x = M + i * (cw + 0.26)
        s.rect(x, 2.30, cw, 2.14, WHITE, line=LINE)
        s.oval(x + 0.26, 2.52, 0.42, 0.42, GREEN)
        s.text(x + 0.26, 2.60, 0.42, 0.26, _p(n, 12.5, WHITE, bold=True, font=HEAD, align="c", ls=1.0))
        s.text(x + 0.26, 3.10, cw - 0.50, 0.26, _p(t, 9.6, GREEN, bold=True, track=0.12))
        s.text(x + 0.26, 3.42, cw - 0.48, 0.95, _p(b, 10.0, INK_2, ls=1.30))
    s.rect(M, 4.84, W, 1.56, GREEN)
    s.text(M + 0.42, 5.10, 3.0, 0.22, _p("IF IT WORKS", 8, CREAM, bold=True, track=0.14))
    s.text(M + 0.42, 5.38, 5.20, 0.85,
           _p("A DMart that is easier for the tired shopper is a DMart she comes back to next month.",
              13, WHITE, ls=1.32))
    s.rect(M + 6.28, 5.14, 0.010, 0.98, "1E7A4C")
    s.text(M + 6.54, 5.10, 3.0, 0.22, _p("IF IT DOESN’T", 8, CREAM, bold=True, track=0.14))
    s.text(M + 6.54, 5.38, 4.30, 0.85,
           _p("You have spent one store and one pilot — and you own the data either way.",
              13, WHITE, ls=1.32))
    slides.append(s)
    return slides


# --------------------------------------------------------------- helpers
def _p(text, size, color, bold=False, font=BODY, align="l", ls=1.2, track=0.0, sa=0):
    return dict(t=text, size=size, color=color, bold=bold, font=font, align=align,
                ls=ls, track=track, sa=sa)


def _points(s, items, y0=Y_BODY, h=1.22, gap=0.20, w=COL_L_W):
    """Up to 3 supporting points: numbered, rule-marked, one line of body each."""
    for i, (title, body) in enumerate(items):
        y = y0 + i * (h + gap)
        s.rect(M, y + 0.05, 0.032, h - 0.22, GREEN if i == 0 else LINE)
        s.text(M + 0.20, y, w - 0.2, 0.24, _p(title, S_PT_T, GREEN, bold=True, track=0.12))
        s.text(M + 0.20, y + 0.30, w - 0.28, h - 0.42, _p(body, S_BODY, INK_2, ls=1.30))


def _table(s, y0, cols, rows, row_h=0.79, size=S_TABLE):
    for name, x, w in cols:
        s.text(x, y0, w, 0.22, _p(name, 7.8, MUTED, bold=True, track=0.14))
    s.rect(M, y0 + 0.26, W, 0.012, GREEN)
    for r, row in enumerate(rows):
        y = y0 + 0.32 + r * row_h
        if r % 2 == 1:
            s.rect(M, y, W, row_h - 0.02, MINT_2)
        for c, (name, x, w) in enumerate(cols):
            cell = row[c]
            col, bold, sz = INK_2, False, size
            if c == 0:
                col, bold, sz = INK, True, size + 0.3
            if "[NEEDED]" in cell:
                col = ALARM
            s.text(x, y + 0.09, w - 0.16, row_h - 0.14, _p(cell, sz, col, bold=bold, ls=1.22))
        s.rect(M, y + row_h - 0.02, W, 0.008, LINE)
