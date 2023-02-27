import React, { useState, useEffect } from "react";
import { useSharedContext } from "./SharedContextProvider";

export default function ({
  customQuery,
  fields,
  id,
  initialValue,
  placeholder,
  clearButton,
  onClearSearch,
  searchChange,
}) {
  const [{ widgets }, dispatch] = useSharedContext();
  const [value, setValue] = useState(initialValue || "");

  // Update external query on mount.
  useEffect(() => {
    update(value);
  }, []);

  // Update query if initialValue change.
  useEffect(() => {
    if (initialValue === undefined || initialValue === null) return;

    update(initialValue);
  }, [initialValue]);

  // If widget value was updated elsewhere (ex: from active filters deletion)
  // We have to update and dispatch the component.
  useEffect(() => {
    widgets.get(id) && update(widgets.get(id).value);
  }, [isValueReady()]);

  // Build a query from a value.
  function queryFromValue(query) {
    if (customQuery) {
      return customQuery(query);
    } else if (fields) {
      return query ? { multi_match: { query, type: "phrase", fields } } : { match_all: {} };
    }
    return { match_all: {} };
  }

  // This functions updates the current values, then dispatch
  // the new widget properties to context.
  // Called on mount and value change.
  function update(v) {
    setValue(v);
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: true,
      needsConfiguration: false,
      isFacet: false,
      wantResults: false,
      query: queryFromValue(v),
      value: v,
      configuration: null,
      result: null,
    });
  }

  // Checks if widget value is the same as actual value.
  function isValueReady() {
    return !widgets.get(id) || widgets.get(id).value == value;
  }

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), []);

  return (
    <div className="react-es-searchbox">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          searchChange && searchChange(e.target.value);
          update(e.target.value);
        }}
        placeholder={placeholder || "Search…"}
      />
      {clearButton && (
        <button
          className="clear"
          onClick={() => {
            update("");
            onClearSearch && onClearSearch();
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
              fill="#838383"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
