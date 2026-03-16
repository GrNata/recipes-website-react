import React, { useState, useEffect } from "react";
import { adminApi} from "../../../api/admin.ts";
import { Pencil, Trash2 } from "lucide-react";
import style from './AdminConversions.module.css';
import type {IngredientDto} from "../../../types";

interface Conversion {
    id: number;
    ingredient: { id: number; name: string };
    unit: { id: number; label: string };
    grams: number;
}

const AdminConversions: React.FC = () => {
    const [conversions, setConversions] = useState<Conversion[]>([]);
    const [ingredients, setIngredients] = useState<IngredientDto[]>([]);

    // Поля формы
    const [ingredientId, setIngredientId] = useState<number | ''>('');
    const [unitId, setUnitId] = useState<number | ''>('');
    const [grams, setGrams] = useState<number | ''>('');

    // Стейт для режима редактирования
    const [editingId, setEditingId] = useState<number | null>(null);

    // Управление колонками (по умолчанию ID на мобилках можно скрыть)
    const [visibleColumns, setVisibleColumns] = useState({
        id: window.innerWidth > 768,
        ingredient: true,
        unit: true,
        grams: true,
        actions: true
    });

    const units = [
        { id: 8, label: 'Стакан' },
        { id: 7, label: 'Ст. ложка' },
        { id: 6, label: 'Чайная ложка' },
        { id: 5, label: 'Штука' },
        { id: 9, label: 'Пучок' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const convData = await adminApi.getAllConversions();
            setConversions(convData);
            const ingData = await adminApi.getAllIngredients();
            setIngredients(ingData);
        } catch (e) {
            console.error("Ошибка загрузки данных", e);
        }
    };

    // Единая функция для Создания и Обновления
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ingredientId || !unitId || !grams) return;

        try {
            if (editingId) {
                // Если мы в режиме редактирования
                await adminApi.updateConversion(editingId, {
                    ingredientId: Number(ingredientId),
                    unitId: Number(unitId),
                    grams: Number(grams)
                });
                alert('Правило обновлено!');
            } else {
                // Если создаем новое
                await adminApi.createConversion({
                    ingredientId: Number(ingredientId),
                    unitId: Number(unitId),
                    grams: Number(grams)
                });
                alert('Правило добавлено!');
            }

            // Сброс формы
            resetForm();
            loadData();
        } catch (e) {
            alert('Ошибка при сохранении. Возможно, правило для этой меры уже существует.');
        }
    };

    const handleEditClick = (c: Conversion) => {
        setEditingId(c.id);
        setIngredientId(c.ingredient.id);
        setUnitId(c.unit.id);
        setGrams(c.grams);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Прокручиваем наверх к форме
    };

    const resetForm = () => {
        setEditingId(null);
        setIngredientId('');
        setUnitId('');
        setGrams('');
    };

    const handleDelete = async  (id: number) => {
        if (!window.confirm('Удалить это правило?')) return;

        try {
            await adminApi.deleteConversion(id);

            console.log('Удалили правило')

            loadData();
        } catch (e) {
            console.error('Ошибка при удалении правила ', e);
        }
    };

    const toggleColumn = (column: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    return (
        <div className={style.container}>
            <h2 className={style.title}>Правила перевода (Меры и Веса)</h2>

            {/* Форма добавления /редактирования */}
            <form onSubmit={handleSubmit} className={style.form}>
                <select
                    className={style.input}
                    value={ingredientId}
                    onChange={e => setIngredientId(Number(e.target.value))}
                    required
                >
                    <option value=''>Выберите продукт</option>
                    {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}> {ing.name}</option>
                    ))}
                </select>

                <select
                    className={style.input}
                    value={unitId}
                    onChange={e => setUnitId(Number(e.target.value))}
                    required
                >
                    <option value="">Выберите меру</option>
                    {units.map(u => (
                        <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                </select>

                <input
                    className={style.input}
                    type="number"
                    step="0.1"
                    placeholder="Вес в граммах (напр. 130)"
                    value={grams}
                    onChange={e => setGrams(Number(e.target.value))}
                    required
                />

                <button type='submit' className={style.btnSubmit}>
                    {editingId ? 'Сохранить изменения' : 'Добавить'}
                </button>

                {editingId && (
                    <button type='button' onClick={resetForm} className={style.btnCancel}>
                        Отмена
                    </button>
                )}
            </form>

            {/* Чипы для управления колонками */}
            <div className={style.chipsContainer}>
                <span className={style.chipsLabel}>Показать колонки:</span>
                <button
                    className={`${style.chip} ${visibleColumns.id ? style.chipActive : ''}`}
                    onClick={() => toggleColumn('id')}
                >ID</button>
                <button
                    className={`${style.chip} ${visibleColumns.ingredient ? style.chipActive : ''}`}
                    onClick={() => toggleColumn('ingredient')}
                >Продукт</button>
                <button
                    className={`${style.chip} ${visibleColumns.unit ? style.chipActive : ''}`}
                    onClick={() => toggleColumn('unit')}
                >Мера</button>
                <button
                    className={`${style.chip} ${visibleColumns.grams ? style.chipActive : ''}`}
                    onClick={() => toggleColumn('grams')}
                >Вес</button>
                <button
                    className={`${style.chip} ${visibleColumns.actions ? style.chipActive : ''}`}
                    onClick={() => toggleColumn('actions')}
                >Действия</button>
            </div>

            {/* Таблица */}
            <div className={style.tableWrapper}>
                <table className={style.table}>
                    <thead>
                    <tr>
                        {visibleColumns.id && <th>ID</th>}
                        {visibleColumns.ingredient && <th>Ингредиент</th>}
                        {visibleColumns.unit && <th>Мера</th>}
                        {visibleColumns.grams && <th>Вес (г)</th>}
                        {visibleColumns.actions && <th>Действия</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {conversions.map(c => (
                        <tr key={c.id}>
                            {visibleColumns.id && <td>{c.id}</td>}
                            {visibleColumns.ingredient && <td>{c.ingredient.name}</td>}
                            {visibleColumns.unit && <td>{c.unit.label}</td>}
                            {visibleColumns.grams && <td><b>{c.grams}</b> г</td>}
                            {visibleColumns.actions && (
                                <td style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        title="Редактировать"
                                        className={style.btnEdit}
                                        onClick={() => handleEditClick(c)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#123C69' }}
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Удалить"
                                        className={style.btnDelete}
                                        onClick={() => handleDelete(c.id)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc3545' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                    {conversions.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                Правила еще не добавлены
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

        </div>
    )
}

export default AdminConversions;