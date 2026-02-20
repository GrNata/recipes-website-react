import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, Save } from "lucide-react";
import { recipeApi } from "../../api/recipes.ts";
import { categoryApi } from "../../api/categories";
import { CategoryTypeDto, CategoryValueDto } from '../../types';
const AddEditRecipe: React.FC = () => {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(id);     //  Если есть id, значит редактируем

//     Главный стрейч формы
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [baseServings, setBaseServings] = useState<number | string>(1);
    const [image, setImage] = useState('');

//     Динамический массив шагов (изначально 1 пустой шаг)
    const [steps, setSteps] = useState<string[]>(['']);

    // СТАТИЧЕСКИЕ ДАННЫЕ (Справочники)
    const [allTypes, setAllTypes] = useState<CategoryTypeDto[]>([]);
    const [allValues, setAllValues] = useState<CategoryValueDto[]>([]);

    // ВЫБРАННЫЕ КАТЕГОРИИ (Храним только ID)
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

//     TODO: потом добавим ингредиенты

    useEffect(() => {
        const loadingDictionaries = async () => {
            try {
                const [types, values] = await Promise.all([
                    categoryApi.getTypes(),
                    categoryApi.getAllValues()
                ]);
                setAllTypes(types);
                setAllValues(values);
            } catch (e) {
                console.error("Ошибка загрузки справочников категорий", e);
            }
        };

        const fetchRecipeForEdit = async () => {
            //     Для редактирования рецепта
            if (isEdit && id) {
                try {
                    // Загружаем данные через API
                    const  recipeData = await recipeApi.getById(Number(id));

                    // Заполняем поля формы полученными данными
                    setName(recipeData.name);
                    setDescription(recipeData.description || '');
                    setBaseServings(recipeData.baseServings || 1);
                    setSteps(recipeData.steps.length > 0 ? recipeData.steps : ['']);
                    setImage(recipeData.image || '');

                    // Извлекаем ID уже выбранных категорий из объекта categoryValues
                    const existingIds = Object.values(recipeData.categoryValues)
                        .map(v => v.id);
                    setSelectedCategoryIds(existingIds);

                    // В будущем здесь также будем устанавливать ингредиенты
                } catch (error) {
                    console.error("Ошибка загрузки рецепта для редактированрия: ", error);
                    alert("Не удалось загрузить данные рецепта");
                    navigate('/my-recipes')
                }
            }
        };
        loadingDictionaries();
        fetchRecipeForEdit();
    }, [id, isEdit, navigate]);

    // Обработка выбора категории
    const handleCategoryChange = (typeId: number, valueId: number) => {
        //     Находим все значения, которые могут относиться к этому типу(чтобы заменить старое на новое)
        const valuesOfThisType = allValues.filter(v => v.typeId === typeId)
            .map(v => v.id);
        setSelectedCategoryIds(prev => {
            //     Удаляем старое значение этого типа и добавляем новое
            const filtered = prev.filter(id => !valuesOfThisType.includes(id));
            return valueId === 0 ? filtered : [...filtered, valueId];
        });
    };

//     -----Логика шагов-----
    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...steps];
        newSteps[index] = value;
        setSteps(newSteps);
    };

    const handleAddStep = () => {
        setSteps([...steps, '']);
    };

    const handleRemoveStep = (indexToRemove: number) => {
        if (steps.length === 1) return;     //  Оставляем хотя бы один шаг
        setSteps((steps.filter((_, index) => index !== indexToRemove)));
    };

//     ----СОХРАНЕНИЕ-----
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // //     Отфильтруем пустые шаги перед сохранением
        //     const clearSteps = steps.filter(step => step.trim() !== '');

        // Подготовка данных по DTO API
        const requestData = {
            name,
            description,
            baseServings: Number(baseServings),
            steps: steps.filter(step => step.trim() !== ''),     //     Отфильтруем пустые шаги перед сохранением
            //     Если создание - categoryValueIds, если обновление - сategoryIds
            [isEdit ? 'categoryIds' : 'categoryValueIds'] : selectedCategoryIds,
            //     Ингредиенты и категории - в следующем шаге
            ingredients: []
        };

        console.log("Отправляеи на сервер: ", requestData);
        alert(("Посмотрите консоль, чтоб увидеть собранные данные!"));
    };

    return (
        <div className={style.container}>
            {/*     Шапка   */}
            <div className={style.headerRow}>
                <button onClick={() => navigate(-1)} className={style.btnBack}>
                    <ArrowLeft size={20} /> Назад
                </button>
                <h1 className={style.title}>
                    {isEdit ? 'Редактировать рецепт' : 'Создать рецепт'}
                </h1>
            </div>

            <form onSubmit={handleSave}>
                {/* ВЕРХНЯЯ ЧАСТЬ: ДВЕ КОЛОНКИ */}
                <div className={style.topGrid}>

                    {/* ЛЕВАЯ КОЛОНКА */}
                    <div className={style.leftCol}>
                        <div className={style.formGroup}>
                            <label className={style.label}>Название</label>
                            < input
                                type="text"
                                className={style.input}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className={style.formGroup}>
                            <label className={style.label}>Описание</label>
                            <textarea
                                className={style.textarea}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            ></textarea>
                        </div>
                    {/*</div>*/}
                        <div className={style.formGroup}>
                            <label className={style.label}>Ссылка на картинку</label>
                            <input
                                type="text"
                                className={style.input}
                                value={image}
                                onChange={e => setImage(e.target.value)}
                                placeholder="https://..."
                            />
                            <div className={style.imagePreview}>
                                <img src={image || 'https://via.placeholder.com/150'} alt="Preview" />
                            </div>
                        </div>

                        <div className={style.formGroup}>
                            <label className={style.label}>Количество порций *</label>
                            <input
                                type="number"
                                className={style.input}
                                value={baseServings}
                                onChange={e => setBaseServings(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                {/*</div>*/}

                {/* ПРАВАЯ КОЛОНКА (КАТЕГОРИИ) */}
                <div className={style.rightCol}>
                    <h3 className={style.sectionTitleSmall}>Категории</h3>
                    <div className={style.categoriesScrollArea}>
                        {allTypes.map(type => (
                            <div key={type.id} className={style.categoryMiniCard}>
                                <span className={style.categoryLabel}>{type.nameType}</span>
                                <select
                                    className={style.categorySelect}
                                    value={selectedCategoryIds.find(id =>
                                        allValues.find(v =>
                                            v.id === id)?.typeId === type.id) ?? ""}
                                    onChange={(e) => handleCategoryChange(type.id, e.target.value)}
                                >
                                    <option value="">-- Выбрать --</option>
                                    {allValues.filter(v => v.typeId === type.id)
                                        .map(v => (
                                            <option key={v.id} value={v.id}>{v.categoryValue}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        ))}

                    </div>
                </div>
                </div>

                {/* НИЖНИЕ БЛОКИ */}
                <div className={style.fullWidthSection}>
                    <h3 className={style.sectionTitle}>Ингоедиенты</h3>
                    {/*{    Здесь будут ингредиенты }  */}
                    <div className={style.placeholderBlock}>Блок ингредиентов</div>
                </div>

                <div className={style.fullWidthSection}>
                    <h3 className={style.sectionTitle}>Шаги приготовления</h3>
                    {steps.map((step, index) => (
                        <div key={index} className={style.stepRow}>
                            <div className={style.stepNumber}>{index + 1}</div>
                            <textarea
                                className={style.stepTextarea}
                                value={step}
                                onChange={(e) => handleStepChange(index, e.target.value)}
                            />
                            <button type="button" onClick={() => handleRemoveStep(index)} className={style.btnDelete}><Trash2 size={18}/></button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddStep} className={style.btnAdd}><Plus size={18}/> Добавить шаг</button>
                </div>

            </form>
        </div>
    )
};


import style from './AddEditRecipe.module.css';

export default AddEditRecipe;