import React, { useState, useEffect,useCallback } from "react";
import { toTermQueries } from "./utils";
import { useSharedContext } from "./SharedContextProvider";

export default function({
  fields,
  id,
  initialValue,
  seeMore,
  placeholder,
  showFilter = true,
  filterValueModifier,
  itemsPerBlock,
  items
}) {
  const [{ widgets }, dispatch] = useSharedContext();
  // Current filter (search inside facet value).
  const [filterValue, setFilterValue] = useState("");
  // Number of itemns displayed in facet.
  const [size, setSize] = useState(itemsPerBlock || 5);
  // The actual selected items in facet.
  const [value, setValue] = useState(initialValue || []);
  // Data from internal queries (Elasticsearch queries are performed via Listener)
  const { result } = widgets.get(id) || {};
  const data = (result && result.data) || [];
  const total = (result && result.total) || 0;

  // Update widgets properties on state change.
   const updateWidget = useCallback(() => {
      dispatch({
        type: "setWidget",
        key: id,
        needsQuery: true,
        needsConfiguration: true,
        isFacet: true,
        wantResults: false,
        query: { bool: { should: toTermQueries(fields, value) } },
        value,
        configuration: { size, filterValue, fields, filterValueModifier },
        result: data && total ? { data, total } : null
      });
    }, [dispatch, size, filterValue,value]);

useEffect(() => {
  updateWidget();
}, [updateWidget]);

// Checks if widget value is the same as actual value.
const isValueReady = useCallback(() => widgets.get(id)?.value ?? true === value, [id, value, widgets]);

  // If widget value was updated elsewhere (ex: from active filters deletion)
  // We have to update and dispatch the component.
  useEffect(() => {
    widgets.get(id) && setValue(widgets.get(id).value);
  }, [isValueReady()]);

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), []);


// On checkbox status change, add or remove current agg to selected
   const handleChange=useCallback((item, checked)=>{
    const newValue = checked
      ? [...new Set([...value, item.key])]
      : value.filter(f => f !== item.key);
    setValue(newValue);

  },[value])

  // Is current item checked?
  const isChecked=useCallback((item)=> {
    return value.includes(item.key);
  },[value])


  return (
    <div className="react-es-facet">
      {showFilter ? (
        <input
          value={filterValue}
          placeholder={placeholder || "filter…"}
          type="text"
          onChange={e => {
            setFilterValue(e.target.value);
          }}
        />
      ) : null}
      {items
        ? items(data, { handleChange, isChecked })
        : data.map(item => (
            <label key={item.key}>
              <input
                type="checkbox"
                checked={isChecked(item)}
                onChange={e => handleChange(item, e.target.checked)}
              />
              {item.key} ({item.doc_count})
            </label>
          ))}
      {data.length === size ? (
        <button onClick={() => setSize(size + (itemsPerBlock || 5))}>
          {seeMore || "see more"}
        </button>
      ) : null}
    </div>
  );
}
