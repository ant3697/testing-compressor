import React from 'react';

interface FingerSealingIllustrationProps {
  currentPsi: number;
  isCompressing: boolean;
  isMeasuringRetention: boolean;
  verdict?: string;
}

/**
 * Anatomically accurate hand with index finger pointing down to seal the discharge tube.
 * Accurately proportioned after the reference drawing:
 * - Natural 3-joint index finger (MCP -> PIP -> DIP -> fingertip)
 * - Tucked thumb and curled fingers beneath the palm
 * - True human proportions (no horizontal elongation)
 * - Clear line art with warm natural skin tones, knuckle creases, and realistic fingernail
 */
export const FingerSealingIllustration: React.FC<FingerSealingIllustrationProps> = ({
  currentPsi,
  isCompressing,
  isMeasuringRetention,
}) => {
  // Pressure threshold: >= 180 PSI overcomes human finger seal
  const isOvercomeByPressure = isCompressing && currentPsi >= 180;
  const isVibrating = isCompressing;

  // Slight lift when pressure overcomes the finger
  const fingerLiftY = isOvercomeByPressure ? -6 : 0;
  const fingerLiftX = isOvercomeByPressure ? -3 : 0;

  return (
    <g id="anatomicalFingerSealingBenchTest">
      <defs>
        {/* Natural Caucasian / Mediterranean skin gradient */}
        <linearGradient id="anatSkinBase" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#fde0c8" />
          <stop offset="35%" stopColor="#fbcda8" />
          <stop offset="70%" stopColor="#f5b486" />
          <stop offset="100%" stopColor="#ea9b69" />
        </linearGradient>

        {/* Dorsal light highlight along back of hand and finger ridge */}
        <linearGradient id="anatDorsalHighlight" x1="0%" y1="0%" x2="100%" y2="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#fff5ee" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ea9b69" stopOpacity="0" />
        </linearGradient>

        {/* Shadow under palm and folded fingers */}
        <linearGradient id="anatPalmShadow" x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#b45309" stopOpacity="0" />
          <stop offset="100%" stopColor="#852b08" stopOpacity="0.45" />
        </linearGradient>

        {/* Realistic fingernail gradient */}
        <linearGradient id="anatNailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff1f2" />
          <stop offset="45%" stopColor="#fecdd3" />
          <stop offset="100%" stopColor="#fb7185" stopOpacity="0.55" />
        </linearGradient>

        {/* Soft shadow cast on compressor dome */}
        <filter id="handDropShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* Main Hand & Finger Group with dynamic vibration / lift */}
      <g
        className={isVibrating ? 'animate-[pulse_0.15s_infinite]' : ''}
        transform={`translate(${fingerLiftX}, ${fingerLiftY})`}
        style={{
          transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* 1. Ambient shadow on compressor dome */}
        <ellipse
          cx="335"
          cy="42"
          rx="45"
          ry="15"
          fill="#000000"
          opacity="0.32"
          filter="url(#handDropShadow)"
        />

        {/* ============================================================== */}
        {/* 2. BASE HAND SILHOUETTE (Exact anatomical proportions)        */}
        {/* ============================================================== */}
        {/* Wrist enters from upper-left (235, -55) to (205, -15)          */}
        {/* Back of hand slopes down to MCP knuckle (295, -16)            */}
        {/* Index finger extends to tip at (370, 30)                      */}
        {/* Palm & thumb loop comfortably underneath                      */}
        <path
          d={`
            M 235 -58
            C 255 -45, 275 -32, 296 -18
            C 305 -12, 318 -3, 328 3
            C 338 9, 348 16, 358 22
            C 365 26, 372 29, 372 32
            C 372 36, 366 38, 360 36
            C 350 33, 342 27, 335 24
            C 328 21, 322 23, 316 26
            C 308 30, 300 35, 290 35
            C 278 35, 268 28, 258 24
            C 245 20, 230 18, 218 8
            C 208 -2, 202 -15, 205 -25
            C 208 -35, 218 -48, 235 -58
            Z
          `}
          fill="url(#anatSkinBase)"
          stroke="#7c2d12"
          strokeWidth="1.7"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dorsal light highlight along the index finger and hand ridge */}
        <path
          d={`
            M 238 -54
            C 256 -42, 275 -30, 294 -17
            C 305 -10, 320 0, 332 7
            C 342 13, 354 20, 364 25
          `}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Palm and underside 3D shadow */}
        <path
          d={`
            M 205 -25
            C 208 -2, 218 8, 230 18
            C 245 20, 258 24, 268 28
            C 278 35, 290 35, 300 35
            C 308 30, 316 26, 322 23
            C 328 21, 335 24, 342 27
            C 350 33, 360 36, 360 36
            C 348 30, 338 22, 330 19
            C 322 17, 314 20, 306 24
            C 295 28, 282 28, 272 23
            C 260 17, 245 14, 235 6
            C 224 -2, 215 -14, 210 -25
            Z
          `}
          fill="url(#anatPalmShadow)"
        />

        {/* ============================================================== */}
        {/* 3. TUCKED THUMB ANATOMY (curled against the palm)              */}
        {/* ============================================================== */}
        <g id="anatThumb">
          {/* Thumb outer curve and fold line */}
          <path
            d="M 248 8 C 260 2, 274 5, 284 12 C 292 18, 294 26, 288 31"
            fill="none"
            stroke="#9a3412"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Thumb joint fold crease */}
          <path
            d="M 256 12 C 263 15, 270 20, 270 25"
            fill="none"
            stroke="#b45309"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          {/* Thumb nail hint */}
          <path
            d="M 284 20 C 288 22, 290 26, 288 29"
            fill="none"
            stroke="#c2410c"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </g>

        {/* ============================================================== */}
        {/* 4. CURLED FINGERS (Middle & Ring knuckles tucked under)        */}
        {/* ============================================================== */}
        <g id="anatCurledFingers">
          {/* Middle finger knuckle underneath index */}
          <path
            d="M 288 24 C 298 21, 310 23, 316 28 C 320 33, 316 37, 308 36"
            fill="none"
            stroke="#9a3412"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Separation between middle and ring fingers */}
          <path
            d="M 296 28 C 302 31, 306 35, 304 38"
            fill="none"
            stroke="#b45309"
            strokeWidth="1.0"
            strokeLinecap="round"
          />
        </g>

        {/* ============================================================== */}
        {/* 5. INDEX FINGER DETAILS (Creases, joints, nail, fingertip)     */}
        {/* ============================================================== */}
        <g id="anatIndexDetails">
          {/* MCP Knuckle Creases (nudillo principal del índice) */}
          <path
            d="M 292 -17 C 296 -19, 301 -18, 304 -14"
            fill="none"
            stroke="#9a3412"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M 295 -14 C 299 -16, 303 -15, 306 -11"
            fill="none"
            stroke="#b45309"
            strokeWidth="1.0"
            strokeLinecap="round"
          />
          <path
            d="M 289 -20 C 293 -22, 298 -21, 301 -17"
            fill="none"
            stroke="#c2410c"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* PIP Joint Creases (articulación interfalángica proximal) */}
          <path
            d="M 324 1 C 327 -1, 332 0, 334 4"
            fill="none"
            stroke="#9a3412"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 326 4 C 329 2, 334 3, 336 7"
            fill="none"
            stroke="#b45309"
            strokeWidth="1.0"
            strokeLinecap="round"
          />

          {/* DIP Joint Creases (articulación distal junto a la uña) */}
          <path
            d="M 350 16 C 353 14, 357 15, 359 19"
            fill="none"
            stroke="#9a3412"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M 352 19 C 355 17, 359 18, 361 22"
            fill="none"
            stroke="#b45309"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Wrist Skin Creases */}
          <path
            d="M 216 -38 C 222 -32, 225 -22, 220 -10"
            fill="none"
            stroke="#9a3412"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.65"
          />
          <path
            d="M 224 -34 C 229 -28, 231 -20, 227 -10"
            fill="none"
            stroke="#b45309"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Real Fingernail (Uña del dedo índice) */}
          <g id="anatFingernail" transform="translate(358, 22) rotate(28)">
            {/* Nail body */}
            <path
              d="M 0 0 C 3 -1, 8 -1, 10 1 C 11 3, 10 6, 8 7 C 5 8, 1 7, 0 5 Z"
              fill="url(#anatNailGrad)"
              stroke="#9a3412"
              strokeWidth="0.8"
            />
            {/* Lunula (white crescent at base of nail) */}
            <path
              d="M 0 1 C 1.5 1.5, 2 3.5, 0.5 4.5"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.75"
            />
            {/* Specular sheen on top of nail */}
            <path
              d="M 2 1.5 Q 5 1 8 2.5"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.85"
            />
          </g>

          {/* Fingertip contact pulp directly sealing the copper tube mouth (cx=370, cy=30) */}
          <ellipse
            cx="369"
            cy="32"
            rx="4.5"
            ry="3.2"
            fill="#ea580c"
            opacity={isCompressing ? 0.75 : 0.4}
          />
        </g>
      </g>

      {/* ============================================================== */}
      {/* 6. TECHNICAL INDICATORS & GAS ESCAPE EFFECTS                   */}
      {/* ============================================================== */}
      {/* A. If high pressure overcomes the finger (>= 180 PSI): */}
      {isOvercomeByPressure && (
        <g id="pressureEscapingJets">
          {/* Pressure escaping jet lines */}
          <path
            d="M 374 24 L 392 14 M 375 28 L 397 25 M 372 20 L 388 6"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="animate-ping"
            opacity="0.85"
          />
          <path
            d="M 368 25 L 356 12 M 365 29 L 348 22"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Escaping air vapor puffs */}
          <circle cx="388" cy="16" r="4.5" fill="#bae6fd" opacity="0.8" />
          <circle cx="398" cy="22" r="3.5" fill="#ffffff" opacity="0.9" />
          <circle cx="356" cy="14" r="3.5" fill="#bae6fd" opacity="0.75" />

          {/* Escape sound badge */}
          <g transform="translate(394, -8)">
            <rect
              x="0"
              y="0"
              width="74"
              height="20"
              rx="4"
              fill="#0369a1"
              stroke="#38bdf8"
              strokeWidth="1.2"
              className="drop-shadow-md"
            />
            <text
              x="37"
              y="13.5"
              fill="#ffffff"
              fontSize="9"
              fontWeight="900"
              fontFamily="monospace"
              textAnchor="middle"
              letterSpacing="0.5"
            >
              ¡VENCE EL DEDO!
            </text>
          </g>
        </g>
      )}

      {/* B. When compressing and holding firmly: */}
      {isCompressing && !isOvercomeByPressure && (
        <g id="fingerHoldingWell" transform="translate(382, -4)">
          <rect
            x="0"
            y="0"
            width="86"
            height="18"
            rx="4"
            fill="#065f46"
            stroke="#34d399"
            strokeWidth="1.1"
          />
          <text
            x="43"
            y="12"
            fill="#a7f3d0"
            fontSize="8"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
          >
            TAPONANDO: {Math.round(currentPsi)} PSI
          </text>
        </g>
      )}

      {/* C. Idle state */}
      {!isCompressing && !isMeasuringRetention && (
        <g id="fingerRestingTag" transform="translate(382, -4)">
          <rect
            x="0"
            y="0"
            width="78"
            height="17"
            rx="3"
            fill="#1e293b"
            stroke="#64748b"
            strokeWidth="0.8"
          />
          <text
            x="39"
            y="11.5"
            fill="#cbd5e1"
            fontSize="7.5"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            DEDO TAPONADOR
          </text>
        </g>
      )}
    </g>
  );
};
