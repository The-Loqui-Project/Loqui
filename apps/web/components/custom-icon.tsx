import React from "react";

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  className?: string;
};

const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = "currentColor",
  className,
}) => {
  const SvgIcon = React.lazy(() => import(`../icons/${name}.svg`));

  return (
    <React.Suspense
      fallback={
        <span className={className} style={{ width: size, height: size }} />
      }
    >
      <SvgIcon
        width={size}
        height={size}
        fill={color}
        className={className}
        aria-hidden="true"
      />
    </React.Suspense>
  );
};

export default Icon;
