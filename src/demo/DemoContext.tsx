import { createContext, useContext, useState, ReactNode } from 'react';

interface DemoCtx {
  isDemo: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
}

const Ctx = createContext<DemoCtx>({ isDemo: false, enterDemo: () => {}, exitDemo: () => {} });
export const useDemo = () => useContext(Ctx);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem('qtest_demo') === 'true');

  const enterDemo = () => {
    localStorage.setItem('qtest_demo', 'true');
    setIsDemo(true);
  };

  const exitDemo = () => {
    localStorage.removeItem('qtest_demo');
    localStorage.removeItem('qtest_token');
    setIsDemo(false);
  };

  return <Ctx.Provider value={{ isDemo, enterDemo, exitDemo }}>{children}</Ctx.Provider>;
}
