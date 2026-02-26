import { motion } from "framer-motion";

export default function LeleliPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-primary/10">
      <main className="z-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <span className="text-[120px] sm:text-[180px] font-extralight leading-none tracking-tighter text-black dark:text-white select-none">
            ∞
          </span>
        </motion.div>
      </main>
    </div>
  );
}
