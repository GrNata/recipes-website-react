import React, { useState, useEffect } from "react";
import { ingredientApi } from "../../api/ingredients";
import type {IngredientDto} from "../../types";
import style from './IngredientSelectorComponent.module.css';


interface Props {
    onSearch: (ids: number[]) => void;
}

export const IngredientSelectorComponent: React.FC<Props> = ({ onSearch }) => {
    const [allIngredients, setAllIngredients] = useState<IngredientDto[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    // Состояние для текста в поле поиска ингредиента
    const [inputValue, setInputValue] = useState('');
    // Состояние для открытия/закрытия списка
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);


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

    const toggleIngredient = (id: number) => {
        if (!selectedIds.includes(id) && selectedIds.length < 10) {
            setSelectedIds(prev => [...prev, id]);
        }
        // setSelectedIds(prev =>
        //     prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        // );
    };

    const handleSearch = () => {
          // Просто передаем текущие ID в RecipeList, ничего не удаляя
          onSearch(selectedIds);
          setIsDropdownOpen(false);     // Добавили закрытие списка
    };

    const clearAll = () => {
        setSelectedIds([]);     // Очищаем локальный стейт
        setInputValue('');
        onSearch([]);           // Сигнализируем родителю сбросить фильтр
        setIsDropdownOpen(false);     // Добавили закрытие списка
    };

    const removeIngredient = (id: number) => {
        // const newIds = selectedIds.filter(itemId => itemId !== id);
        // setSelectedIds(newIds);
        setSelectedIds((prev => prev.filter(itemId => itemId !== id)));
        // Если нужно, чтобы поиск обновлялся сразу при удалении:
        // onSearch(newIds);
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
                    <h4>🔍 Поиск по ингредиентам (выберите до 10)</h4>

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
                            {isDropdownOpen && inputValue.length >= 0 && !selectedIds.length.toString().includes('10') && (
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

                            {/*<select className={style.seachBox} onChange={(e) => toggleIngredient(Number(e.target.value))}*/}
                            {/*        value=""*/}
                            {/*        disabled={selectedIds.length >= 10}*/}
                            {/*>*/}
                            {/*    <option value="" disabled>*/}
                            {/*        {selectedIds.length >= 10 ? 'Максимум 10 ингредиентов' : 'Добавить ингредиент...'}*/}
                            {/*    </option>*/}
                            {/*    {allIngredients*/}
                            {/*        .filter(ing => !selectedIds.includes(ing.id)) // Убираем уже выбранные из списка*/}
                            {/*        .map(ing => (*/}
                            {/*            <option key={ing.id} value={ing.id}>{ing.name}</option>*/}
                            {/*        ))*/}
                            {/*    }*/}
                            {/*</select>*/}
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