import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = document.getElementById("main-scroll");
    if (!container) return;

    const handleScroll = () => {
      setVisible(container.scrollTop > 200);
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const container = document.getElementById("main-scroll");
    if (!container) return;

    container.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 ${
        visible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-75 pointer-events-none"
      }`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}