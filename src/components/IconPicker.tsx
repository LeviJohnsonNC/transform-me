import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { iconMap, getHabitIcon } from '@/utils/habitIcons';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
  const [open, setOpen] = React.useState(false);
  const SelectedIconComponent = getHabitIcon(selectedIcon);
  const iconNames = Object.keys(iconMap);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <SelectedIconComponent size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-5 gap-1">
            {iconNames.map((name) => {
              const IconComponent = iconMap[name];
              const isSelected = name === selectedIcon;
              return (
                <Tooltip key={name}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 ${isSelected ? 'ring-2 ring-primary bg-primary/20' : ''}`}
                      onClick={() => {
                        onSelect(name);
                        setOpen(false);
                      }}
                    >
                      <IconComponent size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {name}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
};
