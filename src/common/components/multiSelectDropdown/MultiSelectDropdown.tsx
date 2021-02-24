import uniqueId from 'lodash/uniqueId';
import React from 'react';

import useDropdownCloseEvents from '../../../hooks/useDropdownCloseEvents';
import useKeyboardNavigation from '../../../hooks/useDropdownKeyboardNavigation';
import { OptionType } from '../../../types';
import Dropdown from '../dropdown/Dropdown';
import ToggleButton from '../dropdown/ToggleButton';
import MultiSelectDropdownMenu from './MultiSelectDropdownMenu';

export interface MultiselectDropdownProps {
  clearButtonLabel?: string;
  icon?: React.ReactElement;
  id?: string;
  onChange: (values: OptionType[]) => void;
  options: OptionType[];
  renderOptionText?: (option: OptionType) => React.ReactChild;
  searchPlaceholder?: string;
  searchValue?: string;
  setSearchValue?: (newVal: string) => void;
  showSearch?: boolean;
  toggleButtonLabel: string;
  value: OptionType[];
}

const MultiSelectDropdown: React.FC<MultiselectDropdownProps> = ({
  clearButtonLabel,
  icon,
  id: _id,
  onChange,
  options,
  renderOptionText,
  searchPlaceholder,
  searchValue: _searchValue,
  setSearchValue,
  showSearch = false,
  toggleButtonLabel,
  value,
}) => {
  const id = _id || uniqueId('multi-select-dropdown');
  const toggleButtonId = `${id}-toggle-button`;
  const menuId = `${id}-menu`;
  const [internalSearchValue, setInternalSearchValue] = React.useState('');
  const searchValue =
    _searchValue !== undefined ? _searchValue : internalSearchValue;

  const dropdown = React.useRef<HTMLDivElement | null>(null);
  const toggleButton = React.useRef<HTMLButtonElement | null>(null);

  const filteredOptions = React.useMemo(() => {
    return [
      ...options.filter((option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      ),
    ].filter((e) => e) as OptionType[];
  }, [options, searchValue]);

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  useDropdownCloseEvents({ container: dropdown, setIsMenuOpen });

  const {
    focusedIndex,
    setup: setupKeyboardNav,
    teardown: teardownKeyboardNav,
  } = useKeyboardNavigation({
    container: dropdown,
    listLength: filteredOptions.length,
    onKeyDown: (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          setIsMenuOpen(false);
          setFocusToToggleButton();
          break;
        case 'ArrowUp':
          ensureMenuIsOpen();
          break;
        case 'ArrowDown':
          ensureMenuIsOpen();
          break;
      }
    },
  });

  const toggleOption = React.useCallback(
    (option: OptionType) => {
      onChange(
        value.map((item) => item.value).includes(option.value)
          ? value.filter((v) => v.value !== option.value)
          : [...value, option]
      );
    },
    [onChange, value]
  );

  const ensureMenuIsOpen = React.useCallback(() => {
    /* istanbul ignore else */
    if (!isMenuOpen) {
      setIsMenuOpen(true);
    }
  }, [isMenuOpen]);

  const setFocusToToggleButton = () => {
    toggleButton.current?.focus();
  };

  const toggleMenu = React.useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);

  React.useEffect(() => {
    setupKeyboardNav();

    return () => {
      teardownKeyboardNav();
    };
  }, [setupKeyboardNav, teardownKeyboardNav]);

  const handleItemChange = (option: OptionType) => {
    toggleOption(option);
  };

  const handleSearchValueChange = React.useCallback(
    (val: string) => {
      setInternalSearchValue(val);

      if (setSearchValue) {
        setSearchValue(val);
      }
    },
    [setSearchValue]
  );

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleSearchValueChange(event.target.value);
  };

  const handleClear = React.useCallback(() => {
    onChange([]);
    handleSearchValueChange('');
  }, [handleSearchValueChange, onChange]);

  const selectedText = React.useMemo(() => {
    const valueLabels = value
      .map((val) => {
        if (renderOptionText) {
          return renderOptionText(val);
        } else {
          return options.find((option) => option.value === val.value)?.label;
        }
      })
      .sort();
    return valueLabels.length > 1
      ? `${valueLabels[0]} + ${valueLabels.length - 1}`
      : valueLabels[0];
  }, [options, renderOptionText, value]);

  React.useEffect(() => {
    if (!isMenuOpen) {
      handleSearchValueChange('');
    }
  }, [handleSearchValueChange, isMenuOpen]);

  return (
    <Dropdown ref={dropdown}>
      <ToggleButton
        ref={toggleButton}
        icon={icon}
        id={toggleButtonId}
        isOpen={isMenuOpen}
        menuId={menuId}
        onClick={toggleMenu}
        selectedText={selectedText?.toString()}
        toggleButtonLabel={toggleButtonLabel}
      />
      <MultiSelectDropdownMenu
        clearButtonLabel={clearButtonLabel}
        focusedIndex={focusedIndex}
        id={menuId}
        isOpen={isMenuOpen}
        onClear={handleClear}
        onItemChange={handleItemChange}
        onSearchChange={showSearch ? handleSearchInputChange : undefined}
        options={filteredOptions}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        value={value}
      />
    </Dropdown>
  );
};

export default MultiSelectDropdown;
