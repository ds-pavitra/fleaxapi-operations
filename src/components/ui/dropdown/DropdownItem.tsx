import type React from "react";
import { Link } from "react-router";

interface DropdownItemProps {
  tag?: "a" | "button";
  to?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  baseClassName?: string;
  className?: string;
  children: React.ReactNode;

  // external link support
  target?: string;
  rel?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  to,
  onClick,
  onItemClick,
  baseClassName = "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  className = "",
  children,
  target,
  rel,
}) => {
  const combinedClasses = `${baseClassName} ${className}`.trim();

  const handleClick = (event: React.MouseEvent) => {
    if (tag === "button") {
      event.preventDefault();
    }
    onClick?.();
    onItemClick?.();
  };

  // 🔹 External link → use <a>
  if (tag === "a" && to && to.startsWith("http")) {
    return (
      <a
        href={to}
        className={combinedClasses}
        target={target}
        rel={rel}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  // 🔹 Internal link → use React Router Link
  if (tag === "a" && to) {
    return (
      <Link to={to} className={combinedClasses} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={combinedClasses}>
      {children}
    </button>
  );
};
