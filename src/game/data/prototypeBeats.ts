import type { BeatPrompt, Grade, TechniqueRound } from "../types";

const gradingSpecs: Array<{ grade: Grade; title: string; attack: string; technique: string; kakeAdvice: string; steveIntro?: string }> = [
  { grade: "yellow", title: "Yellow grading", attack: "Committed straight punch", technique: "O soto gare", kakeAdvice: "IT'S A MAJOR REAP" },
  {
    grade: "orange",
    title: "Orange grading",
    attack: "Faster straight punch",
    technique: "Ippon seoi nage",
    kakeAdvice: "FEET TOGETHER, HIPS OUT",
    steveIntro: "LET'S SEE MY FAVOURITE THROW, IPPON SEOI NAGE!",
  },
  { grade: "green", title: "Green grading", attack: "Heavy straight punch", technique: "Tai otoshi", kakeAdvice: "USE THE MOMENTUM" },
  { grade: "purple", title: "Purple grading", attack: "Sharp lunging punch", technique: "Ko uchi gare", kakeAdvice: "GET LOW, TAKE A DEEP STEP" },
  { grade: "lightBlue", title: "Light blue grading", attack: "Pressing straight punch", technique: "Tsode tsuri komi goshi", kakeAdvice: "GRAB BOTH SLEEVES" },
  { grade: "darkBlue", title: "Dark blue grading", attack: "Explosive punch", technique: "Ude garuma", kakeAdvice: "MAKE IT LOOK NICE" },
  { grade: "brown", title: "Brown grading", attack: "Committed senior attack", technique: "Harai tsuri komi ashi", kakeAdvice: "BLOCK THE ANKLE" },
  {
    grade: "black",
    title: "Black grading",
    attack: "Full-pressure left punch",
    technique: "Sode harai komi o soto garuma gatame from a left punch",
    kakeAdvice: "GOOD LUCK, DUDE",
  },
];

const RHYTHM_SPEED_SCALE = 0.5;
const scaleTime = (ms: number) => Math.round(ms * RHYTHM_SPEED_SCALE);

const kakeSequences: BeatPrompt[][] = [
  [
    { atMs: 1800, input: "RIGHT" },
    { atMs: 2850, input: "DOWN" },
    { atMs: 3900, input: "X" },
    { atMs: 4950, input: "LEFT" },
  ],
  [
    { atMs: 1700, input: "RIGHT" },
    { atMs: 2600, input: "DOWN" },
    { atMs: 3500, input: "X" },
    { atMs: 4400, input: "RIGHT" },
  ],
  [
    { atMs: 1600, input: "LEFT" },
    { atMs: 2450, input: "RIGHT" },
    { atMs: 3300, input: "X" },
    { atMs: 4150, input: "DOWN" },
    { atMs: 5000, input: "X" },
  ],
  [
    { atMs: 1550, input: "LEFT" },
    { atMs: 2350, input: "DOWN" },
    { atMs: 3150, input: "X" },
    { atMs: 3950, input: "RIGHT" },
    { atMs: 4750, input: "DOWN" },
  ],
  [
    { atMs: 1500, input: "RIGHT" },
    { atMs: 2250, input: "LEFT" },
    { atMs: 3000, input: "DOWN" },
    { atMs: 3750, input: "X" },
    { atMs: 4500, input: "RIGHT" },
    { atMs: 5250, input: "X" },
  ],
  [
    { atMs: 1450, input: "LEFT" },
    { atMs: 2150, input: "DOWN" },
    { atMs: 2850, input: "X" },
    { atMs: 3550, input: "RIGHT" },
    { atMs: 4250, input: "X" },
    { atMs: 4950, input: "LEFT" },
  ],
  [
    { atMs: 1400, input: "LEFT" },
    { atMs: 2050, input: "RIGHT" },
    { atMs: 2700, input: "DOWN" },
    { atMs: 3350, input: "X" },
    { atMs: 4000, input: "LEFT" },
    { atMs: 4650, input: "X" },
    { atMs: 5300, input: "RIGHT" },
  ],
  [
    { atMs: 1350, input: "LEFT" },
    { atMs: 1950, input: "DOWN" },
    { atMs: 2550, input: "X" },
    { atMs: 3150, input: "RIGHT" },
    { atMs: 3750, input: "LEFT" },
    { atMs: 4350, input: "DOWN" },
    { atMs: 4950, input: "X" },
    { atMs: 5550, input: "RIGHT" },
  ],
];

export const prototypeRounds: TechniqueRound[] = gradingSpecs.map((spec, index) => {
  const tsukuriDuration = scaleTime(2300 - index * 90);
  const tsukuriBeat = scaleTime(1250 - index * 45);
  const kuzushiDuration = scaleTime(3700 - index * 80);
  const kakePrompts = kakeSequences[index].map((prompt) => ({
    ...prompt,
    atMs: scaleTime(prompt.atMs),
  }));

  return {
    id: `${spec.grade}-grading`,
    grade: spec.grade,
    gradingTitle: spec.title,
    attack: spec.attack,
    technique: spec.technique,
    kakeAdvice: spec.kakeAdvice,
    steveIntro: spec.steveIntro,
    phases: [
      {
        id: "tsukuri",
        mode: "timing",
        name: "Tsukuri",
        focus: "Movement / throw entry",
        camera: "Manga close-up: uke's punch drives towards tori's face.",
        instructorCallout: index < 2 ? "GET OFF THE LINE!" : "MOVE YOUR FEET!",
        result: "Tori slips outside the punch.",
        failResult: "Tori freezes and gets punched in the face.",
        prompts: [{ atMs: tsukuriBeat, input: "LEFT" }],
        failOnBadTiming: true,
        durationMs: tsukuriDuration,
        timingWindow: {
          perfectMs: 48 - Math.min(index, 5) * 3,
          goodMs: 430 - index * 22,
          lateMs: 500 - index * 24,
        },
      },
      {
        id: "kuzushi",
        mode: "mash",
        name: "Kuzushi",
        focus: "Break balance",
        camera: "Manga close-up: tori's hand drives under uke's chin.",
        instructorCallout: index % 2 === 0 ? "TAKE BALANCE! USE YOUR ATEMI!" : "USE YOUR ATEMI! TAKE BALANCE!",
        result: "Uke's head lifts and balance breaks backwards.",
        failResult: "Uke stays rooted and punches through.",
        prompts: [],
        failOnBadTiming: true,
        durationMs: kuzushiDuration,
        mashTarget: 8 + index,
      },
      {
        id: "kake",
        mode: "sequence",
        name: "Kake",
        focus: "Execution / throw",
        camera: "Main mat: tori completes the major outer reap.",
        instructorCallout: index < 3 ? "BEND YOUR KNEES! POSTURE!" : "BEND YOUR KNEES! TURN YOUR HIPS! POSTURE!",
        result: index === gradingSpecs.length - 1
          ? "Perfect osoto gari: dramatic impact finish."
          : "Osoto gari lands cleanly.",
        failResult: "The reap stalls and tori eats the punch.",
        prompts: kakePrompts,
        failOnBadTiming: false,
      },
    ],
  };
});
