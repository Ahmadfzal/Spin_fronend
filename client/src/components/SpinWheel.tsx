import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Loader2, Coins, RotateCcw, Plus, Minus } from "lucide-react";
import { useCreateSpin, useSpins } from "@/hooks/use-spins";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

const SEGMENTS = [
  { label: "FREE SPIN 1", color: "#FFD700", textColor: "#333", type: "reward", value: 1, rewardType: "free" },
  { label: "Zonk", color: "#FF4444", textColor: "#fff", type: "zonk" },
  { label: "JACKPOT X 2", color: "#00E5FF", textColor: "#333", type: "reward", value: 2, rewardType: "jackpot" },
  { label: "Zonk", color: "#9D4EDD", textColor: "#fff", type: "zonk" },
  { label: "FREE SPIN 2", color: "#76FF03", textColor: "#333", type: "reward", value: 2, rewardType: "free" },
  { label: "Zonk", color: "#FF4444", textColor: "#fff", type: "zonk" },
  { label: "JACKPOT X 3", color: "#FF00FF", textColor: "#fff", type: "reward", value: 3, rewardType: "jackpot" },
  { label: "JACKPOT X 10", color: "#FFA500", textColor: "#333", type: "reward", value: 10, rewardType: "jackpot" },
];

const WHEEL_SIZE = 320;
const SPIN_DURATION = 4000;
const SPIN_COST = 5000;

export function SpinWheel() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetRotationRef = useRef<number>(0);

  const { data: user } = useQuery({ queryKey: ["/api/user"] });
  const createSpin = useCreateSpin();
  
  const topUpMutation = useMutation({
    mutationFn: (amount: number) => apiRequest("POST", "/api/user/topup", { amount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/user"] }),
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => apiRequest("POST", "/api/user/withdraw", { amount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/user"] }),
  });

  const handleStop = () => {
    if (!isSpinning || !spinTimeoutRef.current) return;
    clearTimeout(spinTimeoutRef.current);
    finishSpin(targetRotationRef.current);
  };

  const finishSpin = (finalRotation: number) => {
    setIsSpinning(false);
    const normalizedRotation = finalRotation % 360;
    const effectiveAngle = (360 - normalizedRotation + 22.5) % 360;
    const segmentIndex = Math.floor(effectiveAngle / 45);
    const winningSegment = SEGMENTS[segmentIndex % 8];
    
    setResult(winningSegment.label);

    let coinDelta = 0;
    let freeSpinDelta = 0;

    // We already paid/used free spin at start of handleSpin
    if (winningSegment.type === "reward") {
      if (winningSegment.rewardType === "free") {
        freeSpinDelta = winningSegment.value || 0;
      } else if (winningSegment.rewardType === "jackpot") {
        coinDelta = SPIN_COST * (winningSegment.value || 0);
      }
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#00E5FF', '#FF00FF']
      });
    } else {
      // Zonk: The cost was already deducted at the start.
      // But based on user rules: "❌ ZONK Jika mendapat ZONK: coin -= 5.000"
      // Since we already deducted 5000 at start, we don't need to deduct again.
      coinDelta = 0; 
    }

    createSpin.mutate({ 
      result: winningSegment.label,
      coinDelta,
      freeSpinDelta
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/spins"] });
      }
    });

    spinTimeoutRef.current = null;
  };

  const handleSpin = () => {
    if (isSpinning || !user) return;
    
    const hasFreeSpin = user.freeSpins > 0;
    if (!hasFreeSpin && user.coins < SPIN_COST) return;

    setIsSpinning(true);
    setResult(null);

    // Initial deduction logic
    const initialCoinDelta = hasFreeSpin ? 0 : -SPIN_COST;
    const initialFreeSpinDelta = hasFreeSpin ? -1 : 0;
    
    // Optimistically update the UI/DB
    apiRequest("POST", "/api/spins", { 
      result: "Spinning...", 
      coinDelta: initialCoinDelta, 
      freeSpinDelta: initialFreeSpinDelta 
    }).then(res => res.json()).then((data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      const targetSegmentIndex = data.targetSegmentIndex;
      if (targetSegmentIndex === undefined) {
        setIsSpinning(false);
        return;
      }
      
      // Minimum 5 full spins + offset to land precisely in middle of segment (22.5 deg offset)
      const extraSpins = 360 * 5;
      // Target is exactly in the middle of segment: segmentIndex * 45
      const targetAngle = (360 - (targetSegmentIndex * 45)) % 360;
      const currentBase = rotation - (rotation % 360);
      const newRotation = currentBase + extraSpins + targetAngle;
      
      targetRotationRef.current = newRotation;
      setRotation(newRotation);

      spinTimeoutRef.current = setTimeout(() => {
        finishSpin(newRotation);
      }, SPIN_DURATION);
    }).catch(() => {
      setIsSpinning(false);
    });
  };

  const canSpin = user && (user.freeSpins > 0 || user.coins >= SPIN_COST);
  const buttonText = isSpinning 
    ? "STOP" 
    : user && user.freeSpins > 0 
      ? `FREE ${user.freeSpins}` 
      : "SPIN!";

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-4">
      {/* STATUS BAR */}
      <div className="flex gap-4 mb-4">
        <div className="bg-yellow-500/20 px-4 py-2 rounded-xl border border-yellow-500/30 flex items-center gap-2">
          <Coins className="text-yellow-500 h-5 w-5" />
          <span className="font-black text-xl">{user?.coins.toLocaleString() || 0}</span>
        </div>
        <div className="bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30 flex items-center gap-2">
          <RotateCcw className="text-blue-500 h-5 w-5" />
          <span className="font-black text-xl">{user?.freeSpins || 0}</span>
        </div>
      </div>

      {/* TOPUP/WITHDRAW */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => topUpMutation.mutate(50000)}
          className="flex items-center gap-1 bg-green-600 hover:bg-green-500 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
          data-testid="button-topup"
        >
          <Plus size={14}/> TOPUP 50K
        </button>
        <button 
          onClick={() => user?.coins && withdrawMutation.mutate(Math.min(user.coins, 50000))}
          className="flex items-center gap-1 bg-orange-600 hover:bg-orange-500 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
          data-testid="button-withdraw"
        >
          <Minus size={14}/> WITHDRAW 50K
        </button>
      </div>

      <div className="h-12 flex items-center justify-center w-full">
        {result ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            className={`text-3xl font-display font-black text-center ${
              result.includes("Zonk") ? "text-red-400" : "text-primary"
            }`}
          >
            {result.includes("Zonk") ? `😢 ${result}!` : `🎉 ${result}!`}
          </motion.div>
        ) : (
          <p className="text-muted-foreground font-display text-lg animate-pulse">
            {isSpinning ? "Good Luck!" : (user && user.freeSpins > 0 ? "Using Free Spin!" : `Cost: ${SPIN_COST} coins`)}
          </p>
        )}
      </div>

      <div className="relative group">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-12">
          <div className="w-full h-full bg-white border-2 border-gray-800 shadow-xl" 
               style={{ clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)" }} />
        </div>

        <div
          className="relative rounded-full border-4 border-gray-800 shadow-2xl bg-gray-900 overflow-hidden"
          style={{
            width: WHEEL_SIZE,
            height: WHEEL_SIZE,
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? `transform ${SPIN_DURATION}ms cubic-bezier(0.1, 0, 0.1, 1)`
              : `transform 600ms cubic-bezier(0.17, 0.67, 0.83, 0.67)`,
          }}
        >
          {SEGMENTS.map((segment, index) => {
            const rotate = index * 45;
            return (
              <div
                key={index}
                className="absolute top-0 left-0 w-full h-full flex justify-center pt-4"
                style={{ transform: `rotate(${rotate}deg)` }}
              >
                 <div 
                   className="absolute top-0 left-0 w-full h-full origin-center"
                   style={{
                     backgroundColor: segment.color,
                     clipPath: "polygon(50% 50%, 30.8% 0, 69.2% 0)", 
                   }}
                 />
                 <span
                   className="relative z-10 font-bold font-display text-[10px] uppercase tracking-tighter"
                   style={{ color: segment.textColor, transform: "translateY(15px)" }}
                 >
                   {segment.label}
                 </span>
              </div>
            );
          })}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full border-4 border-gray-800 shadow-md z-10 flex items-center justify-center">
            <span className="text-lg">💰</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={isSpinning ? handleStop : handleSpin}
          disabled={(!canSpin && !isSpinning) || createSpin.isPending}
          className={`
            relative px-12 py-4 rounded-full font-black text-2xl uppercase tracking-widest
            transition-all duration-200 transform
            ${isSpinning 
              ? "bg-red-600 text-white shadow-[0_6px_0_rgb(150,0,0)] hover:-translate-y-1 active:translate-y-2 active:shadow-none" 
              : user && user.freeSpins > 0
                ? "bg-gradient-to-b from-blue-400 to-blue-600 text-white shadow-[0_6px_0_rgb(30,58,138)] hover:-translate-y-1 active:translate-y-2 active:shadow-none"
                : canSpin
                  ? "bg-gradient-to-b from-primary to-yellow-600 text-black shadow-[0_6px_0_rgb(180,140,0)] hover:-translate-y-1 active:translate-y-2 active:shadow-none"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed shadow-none grayscale"
            }
          `}
        >
          {buttonText}
        </button>
        {!canSpin && !isSpinning && (
          <p className="text-red-400 text-xs font-bold animate-bounce mt-2">NOT ENOUGH COINS!</p>
        )}
      </div>

      {createSpin.isPending && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating balance...
        </div>
      )}
    </div>
  );
}
