import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, Save } from "lucide-react";
import { recipeApi } from "../../api/recipes.ts";
import { categoryApi } from "../../api/categories";
import type { CategoryTypeDto, CategoryValueDto, IngredientDto, UnitDto, RecipeStatus } from '../../types';
import style from './AddEditRecipe.module.css';
import {dictionaryApi} from "../../api/dictionaries.ts";

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
    const [allIngredients, setAllIngredients] = useState<IngredientDto[]>([]);
    const [allUnits, setAllUnits] = useState<UnitDto[]>([]);
    const [selectedIngredients, setSelectedIngredients] = useState<any[]>([
        { ingredientId: '', amount: '', unitId: '' }
    ]);

    const [status, setStatus] = useState<RecipeStatus>('DRAFT');
    // const [totalCalories, setTotalCalories] = useState<number>(0);

    // ВЫБРАННЫЕ КАТЕГОРИИ (Храним только ID)
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

    // для хранения технических полей при редактировании
    const [recipeMetadata, setRecipeMetadata] = useState<any>(null);

    useEffect(() => {
        const loadingDictionaries = async () => {
            try {
                // Загружаем категории
                const [types, values] = await Promise.all([
                    categoryApi.getTypes(),
                    categoryApi.getAllValues()
                ]);
                setAllTypes(types);
                setAllValues(values);

                // Загружаем ингредиенты и единицы измерения
                const  [ingrsResponse, unitsResponse] = await Promise.all([

                    dictionaryApi.getIngredients(),
                    dictionaryApi.getUnits()
                ]);

                // ПРОВЕРКА: Извлекаем массив из поля content, если бэкенд вернул Page
                // @ts-ignore
                const ingrsArray = ingrsResponse.content || ingrsResponse;
                // @ts-ignore
                const unitsArray = unitsResponse.content || unitsResponse;

                // Безопасно сохраняем только если это массивы
                if (Array.isArray(ingrsArray)) {
                    setAllIngredients(ingrsArray);
                } else {
                    console.error("Ингредиенты не являются массивом:", ingrsResponse);
                }

                if (Array.isArray(unitsArray)) {
                    setAllUnits(unitsArray);
                }
                // setAllIngredients(ingrs);
                // setAllUnits(units);

                console.log('AddEditRecipe: allIngredient: ', ingrsArray)
                console.log('AddEditRecipe: allUnits: ', unitsArray)
            } catch (e) {
                console.error("Ошибка загрузки справочников категорий или игредиентов", e);
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

                    // Сохраняем метаданные для UpdateRecipeRequest
                    setStatus('DRAFT')
                    setRecipeMetadata({
                        createdAt: recipeData.createdAt,
                        publishedAt: recipeData.publishedAt,
                        status: status,
                        author: recipeData.author,
                        totalCalories: recipeData.totalCalories   //  ??? -
                    })

                    // Извлекаем ID уже выбранных категорий из объекта categoryValues
                    const existingIds = Object.values(recipeData.categoryValues)
                        .map(v => v.id);
                    setSelectedCategoryIds(existingIds);

                    // ингредиенты
                    if (recipeData.ingredients) {
                        const formattedIngredients = recipeData.ingredients.map(ing => ({
                            // Нужно брать ID именно из объекта продукта внутри связи
                            // Проверьте структуру вашего DTO (обычно это ing.ingredient.id)ingredientId: ing.id,
                            ingredientId: ing.id,
                            nameEng: ing.nameEng,
                            energyKcal100g: ing.energyKcal100g,
                            amount: ing.amount,
                            unitId: ing.unit?.id
                        }));
                        setSelectedIngredients(formattedIngredients);
                    }
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

    // расчет калорий
    const calculateTotalCalories = () => {
        return selectedIngredients.reduce((sum, item) => {
            const product = allIngredients.find(ing => ing.id === Number(item.ingredientId));
            const amount = parseFloat(item.amount.toString().replace(',', '.'));

            if (product && !isNaN(amount) && product.energyKcal100g) {
                // Расчет: (калории на 100г / 100) * количество
                // Учитываем, что расчет точен для единицы измерения "г" или "мл"
                return sum + (product.energyKcal100g / 100) * amount;
            }
            return sum;
        }, 0);
    };

    const totalCalories = Math.round((calculateTotalCalories()));
    // setTotalCalories(Math.round((calculateTotalCalories())));

    // обработка ингредиентов
    const handleAddIngredient =() => {
      setSelectedIngredients([...selectedIngredients, { ingredientId: '', amount: '', unitId: ''}]);
        // setTotalCalories(Math.round((calculateTotalCalories())));
    };

    const handleIngrChange = (index: number, field: string, value: any) => {
        const updated = [...selectedIngredients];
        updated[index][field] = value;
        setSelectedIngredients(updated);
        // setTotalCalories(Math.round((calculateTotalCalories())));
    };

    const removeIngredient = (index: number) => {
        setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
        // setTotalCalories(Math.round((calculateTotalCalories())));
    };

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

        // Форматируем ингредиенты согласно вашим Request DTO
        console.log('SelectedIngredients: ', selectedIngredients)

        const formattedIngredients = selectedIngredients
            .filter(ing => ing.ingredientId !== '')
            .map(ing => ({
                ingredientId: Number(ing.ingredientId),
                amount: ing.amount,
                unitId: Number(ing.unitId)
        }));

        console.log('FormattedIngredients: ', formattedIngredients)

        // Очищаем шаги от пустых строк
        const cleanSteps = steps.filter(step => step.trim() !== '');

        try {
            if (isEdit && recipeMetadata) {
                // Формируем UpdateRecipeRequest
                const updateRequest = {
                    id: Number(id),
                    name: name,
                    description: description,
                    image: image,
                    createdAt: recipeMetadata.createdAt,
                    publishedAt: recipeMetadata.publishedAt,
                    status: recipeMetadata.status,      //      ???
                    author: recipeMetadata.author,
                    baseServings: Number(baseServings),
                    categoryIds: selectedCategoryIds,
                    ingredients: formattedIngredients,
                    steps: cleanSteps,      //          ???
                    totalCalories: totalCalories
                };

                console.log('UPDATE: ', updateRequest)

                await recipeApi.updateRecipe(Number(id), updateRequest);
            } else  {
                // Формируем CreateRecipeRequest
                const createRecipe = {
                    name,
                    description,
                    image,
                    baseServings: Number(baseServings),
                    categoryValueIds: selectedCategoryIds,
                    ingredients: formattedIngredients,
                    steps: cleanSteps,      //      ???
                    
                };

                console.log('CREATE: ', createRecipe)

                await recipeApi.createRecipe(createRecipe);
            }
            
            navigate('/my-recipes');
        } catch (error) {
            console.error("Ошибка при сохранении:", error);
            alert("Не удалось сохранить рецепт. Проверьте заполнение всех обязательных полей.");
        }
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
                            <label className={style.label}>* Название</label>
                            < input
                                type="text"
                                className={style.input}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className={style.formGroup}>
                            <label className={style.label}>* Описание</label>
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
                                {type.nameType.trim().toLowerCase() === 'тип блюда' ?
                                    <span className={style.categoryLabelImportant}>* {type.nameType} - обязательно!</span>
                                    :
                                    <span className={style.categoryLabel}>{type.nameType}</span>
                                }

                                {/*<span className={style.categoryLabel}>{type.nameType}</span>*/}
                                <select
                                    className={style.categorySelect}
                                    value={selectedCategoryIds.find(id =>
                                        allValues.find(v =>
                                            v.id === id)?.typeId === type.id) ?? ""}
                                    onChange={(e) => handleCategoryChange(type.id, Number(e.target.value))}
                                >
                                    <option value="" style={{ fontSize: '2rem', height: '20px'}}>-- Выбрать --</option>
                                    {allValues.filter(v => v.typeId === type.id)
                                        .map(v => (
                                            <option key={v.id} value={v.id} className={style.categoryOptions}>{v.categoryValue}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        ))}

                    </div>
                </div>
                </div>

                {/* НИЖНИЕ БЛОКИ */}

                {/*     ИНГРЕДИЕНТЫ      */}
                <div className={style.fullWidthSection}>
                    <h3 className={style.sectionTitle}>* Ингредиенты</h3>

                    <div className={style.caloriesInfo}>
                        Общая калорийность: <strong>{totalCalories} ккал</strong>
                    </div>

                    <div className={style.ingredientsTable}>
                        <div className={style.tableHeader}>
                            <span>Продукт</span>
                            <span>Кол-во</span>
                            <span>Ед. изм.</span>
                            <span></span>
                        </div>

                        {selectedIngredients.map((item, index) => (
                            <div key={index} className={style.ingredientRow}>
                            {/*    Выбор ингредиента из словаря     */}
                                <select
                                    className={style.ingrSelect}
                                    value={item.ingredientId}
                                    onChange={(e) => handleIngrChange(index, 'ingredientId', Number(e.target.value))}
                                >
                                    <option value="">-- Выбрать продукт --</option>
                                    {allIngredients.map(ing => (
                                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                                    ))}
                                </select>

                            {/*    Ввод количества  */}
                                <input
                                    type="text"
                                    className={style.amountInput}
                                    placeholder='0'
                                    value={item.amount}
                                    onChange={(e) => handleIngrChange(index, 'amount', e.target.value)}
                                />

                            {/*    Выбор Unit   */}
                                <select
                                    className={style.unitSelect}
                                    value={item.unitId}
                                    onChange={(e) => handleIngrChange(index, 'unitId', Number(e.target.value))}
                                >
                                    <option value="">--</option>
                                    {allUnits.map(unit => (
                                        <option key={unit.id} value={unit.id}>{unit.label}</option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    onClick={() => removeIngredient(index)}
                                    className={style.btnIconDelete}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={handleAddIngredient} className={style.btnAddSmall}>
                        <Plus size={16} /> Добавить ингредиент
                    </button>
                </div>

                {/*     ШАГИ     */}
                <div className={style.fullWidthSection}>
                    <h3 className={style.sectionTitle}>* Шаги приготовления</h3>
                    {steps.map((step, index) => (
                        <div key={index} className={style.stepRow}>
                            <div className={style.stepNumber} >{index + 1}</div>
                            <textarea
                                className={style.stepTextarea}
                                style={{ width: "90%", height: '30px', fontSize: '0.9rem'}}
                                value={step}
                                onChange={(e) => handleStepChange(index, e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveStep(index)}
                                className={style.btnDelete}
                                style={{backgroundColor: "#F7F0EC", color: '#123C69', border: 'solid 1.1px', borderColor: '#24678F', height: '38px'}}
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddStep} className={style.btnAdd}><Plus size={18}/> Добавить шаг</button>
                </div>

                <div className={style.actonRow}>
                    <button type="submit" className={style.btnSave}>
                        <Save size={20} className={style.saveIcon} />
                        {isEdit ? "Сохранить изменения" : "Сохранить рецепт"}
                    </button>
                </div>

            </form>
        </div>
    )
};


export default AddEditRecipe;