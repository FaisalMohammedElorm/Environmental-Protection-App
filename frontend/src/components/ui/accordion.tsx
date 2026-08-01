"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItem {
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="card divide-y divide-canopy-100 dark:divide-canopy-700">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-canopy-800 dark:text-canopy-100">{item.question}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-canopy-400 dark:text-canopy-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && <p className="px-6 pb-5 text-sm leading-relaxed text-canopy-500 dark:text-canopy-400">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
