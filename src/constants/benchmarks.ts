import { StageBenchmark } from '../types';

export const STAGE_BENCHMARKS: Record<number, StageBenchmark> = {
  1: {
    stage_id: 1,
    identity: "Stable Movers",
    items: [
      { category: "Training Stage", details: "Early Beginner" },
      { category: "Primary Alphabet Focus", details: "A, B, C, E, L, R" },
      { category: "Movement Benchmarks", details: "Visible ready position + split step; balanced front lunge (hold 2 sec); recover to base without reminder" },
      { category: "Stroke Benchmarks", details: "7/10 clean forehand clears (half to ¾ court acceptable); basic underarm lift; simple net return" },
      { category: "Grip Benchmark", details: "Forehand grip correct 8/10 times" },
      { category: "Rally Benchmark", details: "8–12 shot cooperative rally" },
      { category: "Serve Benchmark", details: "6/10 legal high serves" },
      { category: "Tactical Awareness", details: "Understand “return to base” concept" },
      { category: "Physical Expectations", details: "Basic coordination, no knee collapse in lunge" },
      { category: "Mental Focus", details: "Maintain attention for full rally" }
    ]
  },
  2: {
    stage_id: 2,
    identity: "Skill Builders",
    items: [
      { category: "Training Stage", details: "Late Beginner / Early Intermediate" },
      { category: "Primary Alphabet Focus", details: "A–P" },
      { category: "Movement Benchmarks", details: "Full 6-point coverage; smooth front & rear transitions; split step timed correctly" },
      { category: "Stroke Benchmarks", details: "8/10 clears reach full backcourt; basic drop differentiation; introductory smash form" },
      { category: "Grip Benchmark", details: "Automatic FH/BH grip change (9/10 correct test)" },
      { category: "Rally Benchmark", details: "15–20 shot cooperative rally" },
      { category: "Serve Benchmark", details: "8/10 legal high serves; basic short serve introduction" },
      { category: "Directional Control", details: "6/10 straight & cross accuracy" },
      { category: "Tactical Awareness", details: "Understand clear to back, drop to front concept" },
      { category: "Physical Expectations", details: "Improved speed & recovery between shots" },
      { category: "Mental Focus", details: "Reset after mistakes within 1 rally" }
    ]
  },
  3: {
    stage_id: 3,
    identity: "Tactical Developers",
    items: [
      { category: "Training Stage", details: "Intermediate Competitive" },
      { category: "Primary Alphabet Focus", details: "A–V" },
      { category: "Movement Benchmarks", details: "Explosive first step; efficient recovery; stable scissor jump landing" },
      { category: "Stroke Benchmarks", details: "Controlled smash; reliable backhand clear; net spin introduction" },
      { category: "Grip & Finger Power", details: "Fast finger acceleration in drives" },
      { category: "Rally Benchmark", details: "20–30 shot rally under pace" },
      { category: "Serve Benchmark", details: "Short serve accuracy 8/10; return control established" },
      { category: "Directional Control", details: "7/10 placement accuracy (straight & cross)" },
      { category: "Tactical Awareness", details: "Identify opponent weakness; basic rally construction" },
      { category: "Physical Expectations", details: "Speed endurance visible across games" },
      { category: "Mental Focus", details: "Emotional control during close rallies" }
    ]
  },
  4: {
    stage_id: 4,
    identity: "Match Performers",
    items: [
      { category: "Training Stage", details: "Advanced / Tournament Level" },
      { category: "Primary Alphabet Focus", details: "Full A–Z" },
      { category: "Movement Benchmarks", details: "Elastic, efficient, anticipatory movement" },
      { category: "Stroke Benchmarks", details: "Deceptive variations; precise smash angles; consistent backhand under pressure" },
      { category: "Grip Mastery", details: "Disguised grip & micro-adjustment" },
      { category: "Rally Benchmark", details: "30+ shot rally under match conditions" },
      { category: "Serve Benchmark", details: "Tactical serve variation & return attack" },
      { category: "Directional Control", details: "8/10 placement precision under pressure" },
      { category: "Tactical Awareness", details: "Match planning & mid-game adjustment" },
      { category: "Physical Expectations", details: "High-level conditioning & recovery capacity" },
      { category: "Mental Focus", details: "Perform under pressure; strong competitive composure" }
    ]
  }
};
