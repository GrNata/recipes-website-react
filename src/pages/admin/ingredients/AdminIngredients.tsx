import React, { useEffect, useState} from "react";
import { adminApi } from "../../../api/admin";
import { Trash2, Edit, Plus, Search } from "lucide-react";
import { toast} from "react-hot-toast";
import style from './AdminIngredient.module.css';
import type {IngredientDto, IngredientRequest} from "../../../types";
import {Pagination} from "../../../components/pagination/Pagination.tsx";

export const AdminIngredients: React.FC = () => {
    const [ingredients, setIngredients] = useState<IngredientDto[]>([]);

    // Стейты для пагинации
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    // Стейт для поиска
    const [search, setSearch] = useState('');

    // Модальное окно
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentIngredient, setCurrentIngredient] = useState<IngredientDto | null>(null);
    const [formData, setFormData] = useState( { name: '', nameEng: '', energyKcal100g: 0 } );

    // Обернули в useCallback, чтобы безопасно вызывать в useEffect
    const loadIngredients = async () => {
        setLoading(true);
        try {
            // const data = await adminApi.getAllIngredients();
            // Передаем search и page на бэкенд
            // Если search пустой, передаем undefined, чтобы не искать по пустой строке
            const data = await adminApi.getPagedIngredients(search || undefined, page, 10);

            // Spring Boot возвращает объект Page. Массив элементов лежит в data.content
            const items = data.content || [];
            const pages = data.totalPages || 0;

            setIngredients(items);
            setTotalPages(pages);

            // // Spring Boot возвращает объект Page, где внутри есть content и totalPages
            // const sortedData = data.sort((a: { name: string; }, b: { name: string; }) => {
            //     return  a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            // });
            // setIngredients(sortedData);
        } catch (e) {
            toast.error('Ошибка загрузки всех ингредиентов');
            console.error('Ошибка загрузки всех ингредиентов', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(0);
    }, [search]);

    useEffect(() => {
        loadIngredients();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Удалить ингредиент? Это может повлиять на существующие рецепты!')) return;

        try {
            await adminApi.deleteIngredient(id);
            setIngredients(prev => prev.filter(i => i.id !== id));
            toast.success('Ингредиент успешно удален');
        } catch (e) {
            toast.error('Не удалось удалить ингредиент.');
            console.error('Не удалось удалить ингредиент.', e);
        }
    };

    const filtered = ingredients.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    // Открыть модальное окно для добавления
    const handleAddClick = () => {
        setCurrentIngredient(null);
        setFormData({ name: '', nameEng: '', energyKcal100g: 0 });
        setIsModalOpen(true);
    };

    // Открыть модальное окно для редактирования
    const handleEditClick = (ingredient: IngredientDto) => {
        setCurrentIngredient(ingredient);
        setFormData({ name: ingredient.name, nameEng: ingredient.nameEnglish ?? '', energyKcal100g: ingredient.energyKcal100g ?? 0 });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log('currentIngredient: ', currentIngredient)
            if (currentIngredient) {
                //     Редактирование
                await adminApi.updateIngredient(currentIngredient?.id, formData);
                toast.success('Обновлен!');
            } else {
            //     Создание
                console.log('formData: ', formData)
                await adminApi.createIngredient(formData);
                toast.success('Создан!');
            }
            setIsModalOpen(false);
            loadIngredients();      //  перегрузка
        } catch (e) {
            toast.error('Ошибка при сохранении ингрегиента');
            console.error('Ошибка при сохранении ингрегиента ', e);
        }
    };

    return (
        <div className={style.container}>
            <div className={style.topBar}>
                <h2 style={{color: '#123C69'}}>Ингредиенты ({ingredients.length})</h2>
                <button
                    className={style.btnAdd}
                    onClick={() => handleAddClick()}
                >
                    <Plus size={20} /> Добавить новый
                </button>
            </div>

            <div style={{ marginBottom: '20px', display:'flex', alignItems:'center', gap: '10px'}}>
                <Search size={20} color='#666' />
                <input
                    className={style.searchBar}
                    placeholder='Поиск по названию...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <>
                <table className={style.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Название</th>
                            <th>Название - английский вариант</th>
                            <th>Калории (на 100г)</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                    {filtered.map(item => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td><strong>{item.name}</strong></td>
                            <td><strong>{item.nameEnglish}</strong></td>
                            <td>{item.energyKcal100g} ккал</td>
                            <td>
                                <button
                                    onClick={() =>
                                        handleEditClick(item)
                                }
                                    style={{background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px'}}>
                                    <Edit size={18} color='#41728F' />
                                </button>
                                <button onClick={() => handleDelete(item.id)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                                    <Trash2 size={18} color='#BF3030' />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Панель пагинации */}
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />

            </>



        {/*    Разметка модального окна (JSX)   */}
            {isModalOpen && (
                <div className={style.modalOverlay}>
                    <div className={style.modalContent}>
                        <h3>{currentIngredient ? 'Редактировать' : 'Добавить'} ингредиент</h3>
                        <form onSubmit={handleSave}>
                            <div className={style.formGroup}>
                                <label>Название </label>
                                <input
                                    type='text'
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                                <label>Название английский вариант </label>
                            </div>
                            <div className={style.formGroup}>
                                <input
                                    type='text'
                                    required
                                    value={formData.nameEng}
                                    onChange={(e) => setFormData({...formData, nameEng: e.target.value})}
                                />
                            </div>
                            <div className={style.formGroup}>
                                <input
                                    type='number'
                                    required
                                    value={formData.energyKcal100g}
                                    onChange={(e) => setFormData({...formData, energyKcal100g: Number(e.target.value)})}
                                />
                            </div>

                            <div className={style.modalButtons}>
                                <button type='button' onClick={() => setIsModalOpen(false)}>Отмена</button>
                                <button type='submit' className={style.btnSave} >Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
};

export default AdminIngredients;