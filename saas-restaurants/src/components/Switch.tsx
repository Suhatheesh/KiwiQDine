import { styled } from '@mui/material/styles';
import Switch, { SwitchProps } from '@mui/material/Switch';
import React from 'react';

export const IOSSwitch = styled(
    React.forwardRef<HTMLButtonElement, SwitchProps>(function IOSSwitch(props, ref) {
        return (
            <Switch
                focusVisibleClassName=".Mui-focusVisible"
                disableRipple
                {...props}
                ref={ref}
            />
        );
    })
)(({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: 2,
        transitionDuration: '300ms',
        '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor: '#2563EB',
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        width: 22,
        height: 22,
    },
    '& .MuiSwitch-track': {
        borderRadius: 26 / 2,
        backgroundColor: '#E9E9EA',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
    },
}));
