import React from 'react';
import Icon from "@/components/custom-icon";

type LoquiIconProps = {
    size?: number;
    color?: string;
    className?: string;
};

const LoquiIcon: React.FC<LoquiIconProps> = ({ size = 24, color = 'currentColor', className }) => {
    return <Icon name="loqui" size={size} color={color} className={className} />;
};

export default LoquiIcon;
