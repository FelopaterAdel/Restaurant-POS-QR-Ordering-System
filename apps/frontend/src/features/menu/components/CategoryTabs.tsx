import { useRef, useEffect } from "react";
import type { PublicCategory } from "../menu.types";

interface CategoryTabsProps {
  categories: PublicCategory[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
}

export function CategoryTabs({
  categories,
  activeCategoryId,
  onSelect,
}: CategoryTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTabRef.current?.scrollIntoView) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategoryId]);

  return (
    <div className="category-tabs" ref={tabsRef} role="tablist">
      {categories.map((category) => (
        <button
          key={category.id}
          ref={category.id === activeCategoryId ? activeTabRef : undefined}
          className={`category-tabs__tab ${
            category.id === activeCategoryId
              ? "category-tabs__tab--active"
              : ""
          }`}
          role="tab"
          aria-selected={category.id === activeCategoryId}
          onClick={() => onSelect(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
