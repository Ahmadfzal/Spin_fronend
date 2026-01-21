import { useSpins } from "@/hooks/use-spins";
import { formatDistanceToNow } from "date-fns";
import { Loader2, History, Trophy, Frown } from "lucide-react";
import { motion } from "framer-motion";

export function SpinHistory() {
  const { data: spins, isLoading } = useSpins();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Sort by newest first
  const sortedSpins = [...(spins || [])].sort((a, b) => {
    return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
  });

  if (sortedSpins.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground/50 border-2 border-dashed border-muted rounded-2xl">
        <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>No spins yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4 text-primary font-display text-xl">
        <History className="w-5 h-5" />
        <h3>Recent Spins</h3>
      </div>
      
      <div className="space-y-3">
        {sortedSpins.map((spin, i) => {
          const isWin = !spin.result.toLowerCase().includes("zonk");
          return (
            <motion.div
              key={spin.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`
                flex items-center justify-between p-4 rounded-xl border-2
                transition-colors duration-200
                ${isWin 
                  ? "bg-primary/5 border-primary/20 hover:border-primary/50" 
                  : "bg-card border-border hover:border-muted-foreground/30"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${isWin ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
                `}>
                  {isWin ? <Trophy className="w-4 h-4" /> : <Frown className="w-4 h-4" />}
                </div>
                <span className={`font-bold ${isWin ? "text-foreground" : "text-muted-foreground"}`}>
                  {spin.result}
                </span>
              </div>
              
              <span className="text-xs text-muted-foreground font-mono">
                {spin.createdAt && formatDistanceToNow(new Date(spin.createdAt), { addSuffix: true })}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
