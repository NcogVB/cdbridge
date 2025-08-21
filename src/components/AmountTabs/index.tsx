import React, { useState } from 'react';

interface Props {
  onChange: (value: number) => void;
}

export default function AmountTabs({ onChange }: Props) {
  const [current, setCurrent] = useState(25);

  const onClick = (value: number) => {
    onChange(value);
    setCurrent(value);
  };

  return (
    <div className="mt-4 flex gap-3">
      {[25, 50, 75, 100].map((percentage) => (
        <div key={percentage} className="flex-1">
          <input
            type="radio"
            name="amount-percentage"
            id={`amount-percentage-${percentage}`}
            className="peer hidden"
            checked={current === null}
            onChange={() => {
              setCurrent(percentage);
              onChange(percentage);
            }}
          />
          <label
            htmlFor={`amount-percentage-${percentage}`}
            className="cursor-pointer w-full block bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors peer-checked:bg-[#3DBEA3] peer-checked:text-white"
          >
            {percentage}%
          </label>
        </div>
      ))}
    </div>
  );
}
