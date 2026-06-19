import { FC } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { Category } from '../../features/category/types';
import { Utensils, Package } from 'lucide-react';

interface CategoryCardProps {
    category: Category;
    itemCount: number;
    isActive: boolean;
    onClick: (categoryId: string) => void;
}

// Vibrant gradient colors for categories
const gradientColors = [
    ['#667eea', '#764ba2'], // Purple
    ['#f093fb', '#f5576c'], // Pink
    ['#4facfe', '#00f2fe'], // Blue
    ['#43e97b', '#38f9d7'], // Green
    ['#fa709a', '#fee140'], // Sunset
    ['#30cfd0', '#330867'], // Teal
    ['#a8edea', '#fed6e3'], // Pastel
    ['#ff9a56', '#ff6a88'], // Orange
];

export const CategoryCard: FC<CategoryCardProps> = ({
    category,
    itemCount,
    isActive,
    onClick,
}) => {
    const theme = useTheme();

    // Generate a consistent gradient based on category name
    const getGradient = (name: string) => {
        const index = name.charCodeAt(0) % gradientColors.length;
        const [start, end] = gradientColors[index];
        return `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    };

    const gradient = getGradient(category.name);

    return (
        <Box
            onClick={() => onClick(category.id)}
            sx={{
                position: 'relative',
                borderRadius: 4,
                padding: 3,
                cursor: 'pointer',
                overflow: 'hidden',
                background: isActive
                    ? gradient
                    : alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(10px)',
                border: isActive
                    ? `2px solid ${alpha('#fff', 0.3)}`
                    : `1px solid ${theme.palette.divider}`,
                boxShadow: isActive
                    ? `0 12px 32px ${alpha('#000', 0.15)}`
                    : `0 4px 12px ${alpha('#000', 0.05)}`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                height: 240,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                '&:hover': {
                    transform: 'translateY(-6px) scale(1.03)',
                    boxShadow: `0 20px 40px ${alpha('#000', 0.2)}`,
                    borderColor: isActive ? alpha('#fff', 0.5) : theme.palette.primary.main,
                    '& .category-icon': {
                        transform: 'rotate(360deg) scale(1.2)',
                    },
                    '&::before': {
                        opacity: isActive ? 1 : 0.1,
                    },
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: gradient,
                    opacity: isActive ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                    zIndex: 0,
                },
            }}
        >
            {/* Background Pattern */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: alpha(isActive ? '#fff' : theme.palette.primary.main, 0.1),
                    zIndex: 0,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: alpha(isActive ? '#fff' : theme.palette.primary.main, 0.05),
                    zIndex: 0,
                }}
            />

            {/* Content */}
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* Icon */}
                <Box
                    className="category-icon"
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background: alpha(isActive ? '#fff' : theme.palette.primary.main, 0.2),
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        border: `1px solid ${alpha(isActive ? '#fff' : theme.palette.primary.main, 0.3)}`,
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <Utensils
                        size={24}
                        color={isActive ? '#fff' : theme.palette.primary.main}
                        strokeWidth={2.5}
                    />
                </Box>

                {/* Category Name */}
                <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                        color: isActive ? '#fff' : theme.palette.text.primary,
                        mb: 0.5,
                        textShadow: isActive ? `0 2px 8px ${alpha('#000', 0.2)}` : 'none',
                        transition: 'color 0.3s ease',
                    }}
                >
                    {category.name}
                </Typography>

                {/* Description */}
                {category.description && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: isActive ? alpha('#fff', 0.9) : theme.palette.text.secondary,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                            mb: 2,
                        }}
                    >
                        {category.description}
                    </Typography>
                )}
            </Box>

            {/* Item Count Badge */}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    padding: '8px 12px',
                    borderRadius: 2,
                    background: alpha(isActive ? '#fff' : theme.palette.primary.main, 0.15),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(isActive ? '#fff' : theme.palette.primary.main, 0.2)}`,
                    width: 'fit-content',
                }}
            >
                <Package size={16} color={isActive ? '#fff' : theme.palette.primary.main} />
                <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{
                        color: isActive ? '#fff' : theme.palette.primary.main,
                    }}
                >
                    {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                </Typography>
            </Box>

            {/* Active Indicator */}
            {isActive && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: `0 0 0 4px ${alpha('#fff', 0.3)}`,
                        zIndex: 2,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                            '0%': {
                                boxShadow: `0 0 0 0 ${alpha('#fff', 0.7)}`,
                            },
                            '70%': {
                                boxShadow: `0 0 0 10px ${alpha('#fff', 0)}`,
                            },
                            '100%': {
                                boxShadow: `0 0 0 0 ${alpha('#fff', 0)}`,
                            },
                        },
                    }}
                />
            )}
        </Box>
    );
};
