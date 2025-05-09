
import React from "react";
import RegionSelector from "./RegionSelector";

export function renderQuestion(block, value, onChange, answers) {
  switch (block.type) {
    case "region":
      return (
        <RegionSelector
          key={block.name}
          block={block}
          value={value}
          onChange={onChange}
          answers={answers}
        />
      );
    // other cases...
    default:
      return null;
  }
}
