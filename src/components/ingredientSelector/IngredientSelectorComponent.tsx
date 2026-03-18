import React, { useState, useEffect } from "react";
import { ingredientApi } from "../../api/ingredients";
import type {IngredientDto} from "../../types";
import style from './IngredientSelectorComponent.module.css';


interface Props {
    onSearch: (ids: number[], mode: string) => void;
}

export const IngredientSelectorComponent: React.FC<Props> = ({ onSearch }) => {
    const [allIngredients, setAllIngredients] = useState<IngredientDto[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    // Состояние для текста в поле поиска ингредиента
    const [inputValue, setInputValue] = useState('');
    // Состояние для открытия/закрытия списка
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // НОВОЕ: Стейт для режима поиска
    const [searchMode, setSearchMode] = useState<'ALL' | 'ANY' | 'EXACT'>('ALL');


    useEffect(() => {
        // Загрузка всех доступных ингредиентов
        const fetchAll = async () => {
            try {
                const data = await ingredientApi.getAll();
                // СРАЗУ СОРТИРУЕМ ПО АЛФАВИТУ (А-Я)
                const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
                setAllIngredients(sortedData);
            } catch (e) {
                console.error('Failed to load ingredients', e);
            }

        };
        fetchAll();
    }, []);

    // Логика добавления
    const addIngredient = (id: number) => {
        if (!selectedIds.includes(id) && selectedIds.length < 10) {
            setSelectedIds(prev => [...prev, id]);
            setInputValue('');          // Очищаем поле ввода после выбора
            setIsDropdownOpen(false);   // Закрываем список (опционально)
        }
    };

    // const toggleIngredient = (id: number) => {
    //     if (!selectedIds.includes(id) && selectedIds.length < 10) {
    //         setSelectedIds(prev => [...prev, id]);
    //     }
    //     // setSelectedIds(prev =>
    //     //     prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    //     // );
    // };

    const handleSearch = () => {
          // Просто передаем текущие ID в RecipeList, ничего не удаляя - + ПЕРЕДАЕМ И РЕЖИМ
          onSearch(selectedIds, searchMode);
          setIsDropdownOpen(false);     // Добавили закрытие списка
    };

    const clearAll = () => {
        setSelectedIds([]);     // Очищаем локальный стейт
        setInputValue('');
        setSearchMode('ALL')        // Сбрасываем режим
        onSearch([], 'ALL');           // Сигнализируем родителю сбросить фильтр
        setIsDropdownOpen(false);     // Добавили закрытие списка
    };

    const removeIngredient = (id: number) => {
        setSelectedIds((prev => prev.filter(itemId => itemId !== id)));
    };

    // ФИЛЬТРАЦИЯ СПИСКА
    // 1. Исключаем уже выбранные
    // 2. Фильтруем по введенному тексту (без учета регистра)
        const availabelIngredients = allIngredients
            .filter(ing => !selectedIds.includes(ing.id))
            .filter(ing => ing.name.toLowerCase().includes(inputValue.toLowerCase()))

        return (
            <div className={style.ingredientPanel}>
                <div className={style.actions}>
                    {/*<h4>🔍 Поиск по ингредиентам (выберите до 10)</h4>*/}
                    <h4>🔍 Выберите до 10 ингрединтов</h4>

                    <div className={style.actions}>
                    {/* КАСТОМНЫЙ ПОИСКОВОЙ ВЫПАДАЮЩИЙ СПИСОК */}
                        <div className={style.searchDropdownContainer}>
                            <input
                                type="text"
                                placeholder={selectedIds.length >= 10 ? "Лимит достигнут" : "Введите ингредиент..."}
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setIsDropdownOpen(true); // Открываем список при вводе
                                }}
                                onFocus={() => setIsDropdownOpen(true)} // Открываем при клике
                                // onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // (Опционально) Закрытие при клике вне
                                disabled={selectedIds.length >= 10}
                                className={style.dropdownInput}
                            />

                            {/* Выпадающий список результатов */}
                            {/*{isDropdownOpen && inputValue.length >= 0 && !selectedIds.length.toString().includes('10') && (*/}
                            {isDropdownOpen && inputValue.length >= 0 && selectedIds.length < 10 && (
                                <ul className={style.dropdownList}>
                                    {availabelIngredients.length > 0 ? (
                                        availabelIngredients.map(ing => (
                                            <li
                                                key={ing.id}
                                                onClick={() => addIngredient(ing.id)}
                                            >
                                                {ing.name}
                                            </li>
                                        ))
                                    ) : (
                                        <li className={style.noResult}>Ничего не найдено</li>
                                    )}
                                </ul>
                            )}
                        </div>

                        {/* Кнопки действий */}
                        <div className={style.buttonGroup}>
                            <button onClick={handleSearch} className={style.searchBtn} disabled={selectedIds.length === 0}>
                                Найти
                            </button>
                            <button onClick={clearAll} className={style.clearBtn}>
                                Сбросить все
                            </button>
                        </div>
                    </div>

                    {/* НОВОЕ: Блок радио-кнопок для выбора логики */}
                    {selectedIds.length > 0 && (
                        <div className={style.radioGroup}>
                            <label className={style.radioLabel}>
                                <input
                                    type='radio'
                                    value='ALL'
                                    checked={searchMode === 'ALL'}
                                    onChange={() => setSearchMode('ALL')}
                                />
                                <span>Все ингредиенты (включая виды)</span>
                            {/*  Если вы добавили в поиск 3 ингредиента (например, Картофель, Лук, Морковь), то система отсеет все рецепты, где есть только 2 из 3. Рецепт обязан содержать всю троицу.  */}
                            {/*  Вот здесь включается та самая магия группировки, которую мы добавили в базу данных.
Если вы выбираете в поиске родительскую категорию, система ищет рецепты, в которых есть или этот родитель, или любой из его детей.  */}
                            </label>
                            <label className={style.radioLabel}>
                                <input
                                    type='radio'
                                    value='ANY'
                                    checked={searchMode === 'ANY'}
                                    onChange={() => setSearchMode('ANY')}
                                />
                                <span>Хотя бы один из выбранных</span>
                            </label>
                            <label className={style.radioLabel}>
                                <input
                                    type='radio'
                                    value='EXACT'
                                    checked={searchMode === 'EXACT'}
                                    onChange={() => setSearchMode('EXACT')}
                                />
                                <span>Строгое совпадение</span>
                            </label>
                        </div>
                    )}

                    {/* Список выбранных ингредиентов (Чипсы) */}
                    <div className={style.chipsContainer}>
                        {selectedIds.map(id => {
                            const ing = allIngredients.find(i => i.id === id);
                            return (
                                <div key={id} className={style.chip}>
                                    {ing?.name}
                                    <button onClick={() => removeIngredient(id)} className={style.removeBtn}>×</button>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/*<div className={style.actions}>*/}
                    {/*<select onChange={(e) => toggleIngredient(Number(e.target.value))}*/}
                    {/*        value=""*/}
                    {/*        disabled={selectedIds.length >= 10}*/}
                    {/*>*/}
                    {/*    <option value="" disabled>*/}
                    {/*        {selectedIds.length >= 10 ? 'Максимум 10 ингредиентов' : 'Добавить ингредиент...'}*/}
                    {/*    </option>*/}
                    {/*    {allIngredients*/}
                    {/*        .filter(ing => !selectedIds.includes(ing.id)) // Убираем уже выбранные из списка*/}
                    {/*        .map(ing => (*/}
                    {/*        <option key={ing.id} value={ing.id}>{ing.name}</option>*/}
                    {/*         ))*/}
                    {/*    }*/}
                    {/*</select>*/}

                    {/*<div className={style.buttonGroup}>*/}
                    {/*    <button onClick={handleSearch} className={style.searchBtn} disabled={selectedIds.length === 0}>*/}
                    {/*        Найти*/}
                    {/*    </button>*/}
                    {/*    <button onClick={clearAll} className={style.clearBtn}>*/}
                    {/*        Сбросить все*/}
                    {/*    </button>*/}
                    {/*</div>*/}

                {/*</div>*/}

            </div>
        );

};