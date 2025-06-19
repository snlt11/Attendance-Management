"use client";

import * as React from "react";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface TimePickerProps {
    label?: string;
    error?: string[];
    value: string;
    onChange: (value: string) => void;
    id?: string;
    className?: string;
}

const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const h = hour.toString().padStart(2, '0');
            const m = minute.toString().padStart(2, '0');
            times.push({
                label: `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`,
                value: `${h}:${m}`, // Keep 24-hour format for value
                hour24: h,
                minute: m
            });
        }
    }
    return times;
};

const timeOptions = generateTimeOptions();

// Convert 24-hour format to 12-hour format for display
const formatTimeForDisplay = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`;
};

// Convert 12-hour format to 24-hour format
const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    let hour = parseInt(hours);

    if (hour === 12) {
        hour = modifier === 'PM' ? 12 : 0;
    } else if (modifier === 'PM') {
        hour = hour + 12;
    }

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
};

export function TimePicker({ label, error, value, onChange, id, className }: TimePickerProps) {
    // Find display value from the timeOptions
    const displayValue = value ? formatTimeForDisplay(value) : '';

    return (
        <div className="space-y-2">
            {label && <Label htmlFor={id}>{label}</Label>}
            <Select
                value={value}
                onValueChange={onChange}
            >
                <SelectTrigger id={id} className={`${className} ${error ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select time">
                        {displayValue || "Select time"}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <div className="max-h-[300px] overflow-auto">
                        {timeOptions.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                                {time.label}
                            </SelectItem>
                        ))}
                    </div>
                </SelectContent>
            </Select>
            {error?.map((err, index) => (
                <p key={index} className="text-sm text-red-500">
                    {err}
                </p>
            ))}
        </div>
    );
}
