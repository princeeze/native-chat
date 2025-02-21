import { useEffect, useState } from "react";

declare global {
  interface Window {
    ai: any;
  }
}

const useLanguageDetector = () => {
  const [detector, setDetector] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { capabilities } = await window.ai.languageDetector.capabilities();
      if (capabilities === "no") return;
      const instance = await window.ai.languageDetector.create(
        capabilities === "after-download"
          ? {
              monitor: (m: any) =>
                m.addEventListener("downloadprogress", console.log),
            }
          : undefined
      );
      if (capabilities === "after-download") await instance.ready;
      setDetector(instance);
    };
    init();
  }, []);

  return detector;
};

export default useLanguageDetector;
