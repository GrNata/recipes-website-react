import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, Save } from "lucide-react";
import { toast } from 'react-hot-toast';
import { recipeApi } from "../../api/recipes.ts";
import { categoryApi } from "../../api/categories";
import { uploadRecipeImage } from "../../api/image";
import type { CategoryTypeDto, CategoryValueDto, IngredientDto, UnitDto, RecipeStatus } from '../../types';
import style from './AddEditRecipe.module.css';
import {dictionaryApi} from "../../api/dictionaries.ts";
import { getImageUrl } from '../../utils/imageUtils';


const AddEditRecipe: React.FC = () => {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(id);     //  Если есть id, значит редактируем

    const [errors, setErrors] = useState<Record<string, string>>({});

//     Главный стрейч формы
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [baseServings, setBaseServings] = useState<number | string>(1);
    const [image, setImage] = useState('');

    const [hours, setHours] = useState<number | ''>('');
    const [minutes, setMinutes] = useState<number | ''>('');

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

    const [isUploading, setIsUploading] = useState(false);

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

                    // Склеиваем часы и минуты в общее число минут
                    const totalCookingTime = (Number(hours) || 0) * 60 + (Number(minutes) ||  0);

                    // ????
                    if (recipeData.cookingTimeMinutes) {
                        setHours(Math.floor(recipeData.cookingTimeMinutes / 60));
                        setMinutes(recipeData.cookingTimeMinutes % 60);
                    }

                    // Сохраняем метаданные для UpdateRecipeRequest
                    setStatus('DRAFT')
                    setRecipeMetadata({
                        createdAt: recipeData.createdAt,
                        publishedAt: recipeData.publishedAt,
                        status: status,
                        author: recipeData.author,
                        cookingTimeMinutes: totalCookingTime,
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

//     Валидация перед сохранением
    const validateFrom = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) newErrors.name = 'Название обязательно!';
        if (!description.trim()) newErrors.description = 'Добавьте хотя бы краткое описание';
        if (Number(baseServings) <= 0) newErrors.servings = 'Количество порций должно быть больше нуля.';

        // 1. Находим объект типа "Тип блюда" в справочнике типов
        const dishType = allTypes.find(t => t.nameType.trim().toLowerCase() === 'тип блюда');

        // 2. Проверяем, есть ли в выбранных категориях хотя бы одна, чей typeId совпадает с ID "Типа блюда"
        const hasDishType = selectedCategoryIds.some(selectedId => {
            const val = allValues.find(v => v.id === selectedId);
            return val?.typeId === dishType?.id;
        });

        // 3. Если такой категории нет — записываем ошибку
        if (!hasDishType) {
            newErrors.categories = 'Выберите "Тип блюда"!';
        }

    //     Проверка ингредиентов
        const validIngredients = selectedIngredients.filter(ing => ing.ingredientId !== ''
                                                                    && ing.amount !== ''
                                                                    && ing.unitId !== '');
        if (validIngredients.length === 0) {
            newErrors.ingredients = 'Добавьте хотя бы один ингредиент с количеством';
        }

    //     Проверка шагов
        const validSteps = steps.filter(s => s.trim() !== '');
        if (validSteps.length === 0) {
            newErrors.steps = "Опишите хотя бы один шаг приготовления";
        }

        setErrors(newErrors);
        // Если объект ошибок пуст, значит всё хорошо
        return Object.keys(newErrors).length === 0;
    };

//     обработчик выбора файла - IMAGE - функция сработает, как только пользователь выберет картинку на компьютере/телефоне
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          setIsUploading(true);
          // Отправляем файл на сервер
          const uploadeUrl = await uploadRecipeImage(file);

          // Сервер вернул путь (например, /uploads/recipes/123.jpg)
          // Обновляем наш основной стейт формы
          setImage(uploadeUrl);
          toast.success('Фото успешно загружено!');
      } catch (e) {
          console.error("Ошибка при загрузке картинки ", e);
          toast.error("Не удалось загрузить фотографию");
      } finally {
          setIsUploading(false);
      }
    };

//     ----СОХРАНЕНИЕ-----
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateFrom()) {
            toast.error("Пожалуйста, заполните все обязательные поля");
            return;
        }

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

        let updateRequest;
        let createRequest;

        const totalCookingTime = (Number(hours) || 0) * 60 + (Number(minutes) ||  0);

        // // --- АВТОМАТИЗАЦИЯ КАТЕГОРИИ "БЫСТРЫЕ" (ID = 1) ---
        // let finalCategoryIds = [...selectedCategoryIds];
        // const FAST_CATEGORY_ID = 1; // ID значения "Менее 30 мин" из базы данных
        //
        // if (totalCookingTime > 0 && totalCookingTime <= 30) {
        //     // Если время <= 30 минут, ДОБАВЛЯЕМ категорию (если ее еще нет)
        //     if (!finalCategoryIds.includes(FAST_CATEGORY_ID)) {
        //         finalCategoryIds.push(FAST_CATEGORY_ID);
        //     }
        // } else {
        //     // Если время > 30 минут (или 0), УДАЛЯЕМ категорию (если она там была)
        //     finalCategoryIds = finalCategoryIds.filter(id => id !== FAST_CATEGORY_ID);
        // }
        //     // ___________________

            if (isEdit && recipeMetadata) {

                // Формируем UpdateRecipeRequest
                updateRequest = {
                    id: Number(id),
                    name: name,
                    description: description,
                    image: image,
                    createdAt: recipeMetadata.createdAt,
                    publishedAt: recipeMetadata.publishedAt,
                    status: recipeMetadata.status,      //      ???
                    author: recipeMetadata.author,
                    baseServings: Number(baseServings),
                    cookingTimeMinutes: totalCookingTime,
                    categoryIds: selectedCategoryIds,
                    ingredients: formattedIngredients,
                    steps: cleanSteps,      //          ???
                    totalCalories: totalCalories
                };

                console.log('UPDATE: ', updateRequest)

                // await recipeApi.updateRecipe(Number(id), updateRequest);

            } else  {
                // Формируем CreateRecipeRequest
                createRequest = {
                    name,
                    description,
                    image,
                    baseServings: Number(baseServings),
                    cookingTimeMinutes: totalCookingTime,
                    categoryValueIds: selectedCategoryIds,
                    ingredients: formattedIngredients,
                    steps: cleanSteps,      //      ???
                    
                };

                console.log('CREATE: ', createRequest)

                // await recipeApi.createRecipe(createRecipe);
            }

        // Создаем "обещание" (promise) для сохранения
        const savePromise = isEdit
            ? recipeApi.updateRecipe(Number(id), updateRequest)
            : recipeApi.createRecipe(createRequest);

        // toast.promise сам покажет лоадер, а потом успех или ошибку
        toast.promise(savePromise, {
            loading: 'Сохраняем рецепт...',
            success: isEdit ? 'Рецепт сохранен! ✨\'' : 'Создан черновик рецепта, можно отправить на публикацию! 🚀',
            error: 'Ошибка при сохранении. Проверте данные. ❌',
        });

            try {
                await savePromise;
                navigate('/my-recipes');
            } catch (error) {
            console.error("Ошибка при сохранении:", error);
            // alert("Alert: Не удалось сохранить рецепт. Проверьте заполнение всех обязательных полей.");
        }
    };

    // @ts-ignore
    // @ts-ignore
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
                                className={`${style.input} ${errors.name ? style.inputError : ''}`}
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors(prev => ({ ...prev, name: ''})); // Убираем ошибку при вводе
                            }}
                                required
                            />
                            {errors.name && <span className={style.errorMessage}>{errors.name}</span>}
                        </div>
                        <div className={style.formGroup}>
                            <label className={style.label}>* Описание</label>
                            <textarea
                                className={style.textarea}
                                value={description}
                                onChange={e => {
                                    setDescription(e.target.value);
                                    if (errors.description) setErrors(prev => ({ ...prev, description: ''}));
                                }}
                            ></textarea>
                            {errors.description && <span className={style.errorMessageDesc}>{errors.description}</span>}
                        </div>
                    {/*</div>*/}

                        {/*   ------     IMAGE  ------- */}
                        <div className={style.formGroup}>
                            <label className={style.label}>Фото рецепта</label>

                            {/* Показываем превью картинки, если она уже загружена */}
                            {image && (
                                <div className={style.imagePreviewBlock }>
                                    <img
                                        // ВАЖНО: Если сервер возвращает локальный путь (без http),
                                        // нам нужно подставить базовый URL бэкенда для отображения
                                        src={getImageUrl(image)}   // Укажите порт вашего бэкенда!
                                        alt="Превью рецепта"
                                        className={style.imagePreviewContent}
                                    />
                                </div>
                            )}
                            {/* Само поле для выбора файла */}
                            <input
                                type="file"
                                className={style.input}
                                onChange={handleImageChange}
                                disabled={isUploading}
                                placeholder="https://..."
                            />

                            {isUploading && <span style={{ marginLeft: '10px', color: '#41728F'}}>Загружаем... ⏳ </span>}
                            {/*<div className={style.imagePreview}>*/}
                            {/*    <img src={image || 'https://via.placeholder.com/150'} alt="Preview" />*/}
                            {/*</div>*/}
                        </div>
                        {/*     ------------        */}

                        {/*     Количество порций   */}
                        <div className={style.formGroup}>
                            <div className={style.formRow}>
                                <div className={style.blockQuantity}>
                                    <label className={style.label}>Количество порций *</label>
                                    <div style={{ paddingTop: '10px'}}>
                                    <input
                                        type="number"
                                        className={style.inputQuantity}
                                        value={baseServings}
                                        onChange={e => setBaseServings(e.target.value)}
                                        required
                                    />
                                    </div>
                                </div>
                            {/*</div>*/}

                            {/*     Время приготовления */}
                            {/*<div className={style.formGroup}>*/}
                                <div className={style.blockQuantity}>
                                    <label className={style.label}>Время приготовления</label>
                                    <div style={{ display:'flex', gap: '15px', alignItems:'center'}}>
                                        <div style={{ display:'flex', alignItems: 'center', gap: '5px', paddingTop: '10px'}}>
                                            <input
                                                type='number'
                                                min="0"
                                                max="72"
                                                placeholder='0'
                                                value={hours}
                                                onChange={(e) => setHours(e.target.value ? Number(e.target.value) : '')}
                                                className={style.inputTime}
                                            />
                                            <span> ч</span>
                                        </div>

                                        <div style={{ display:'flex', alignItems: 'center', gap: '5px', paddingRight: '10px', paddingTop: '10px'}}>
                                            <input
                                                type='number'
                                                min="0"
                                                max="59"
                                                placeholder='0'
                                                value={minutes}
                                                onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : '')}
                                                className={style.inputTime}
                                            />
                                            <span> мин</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                {/*</div>*/}

                {/* ПРАВАЯ КОЛОНКА (КАТЕГОРИИ) */}
                <div className={style.rightCol}>
                    <h3 className={`${style.sectionTitleSmall} ${errors.categories ? style.errorSection : ''}`}>
                        Категории
                    </h3>
                    {errors.categories && <span className={style.errorMessage}>{errors.categories}</span>}

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
                                    onChange={(e) => {
                                        handleCategoryChange(type.id, Number(e.target.value));
                                        // if (errors.categories) setErrors((prev => ({ ...prev, description: ''})));
                                    }}
                                >
                                    <option value="" style={{ fontSize: '2rem', height: '20px'}}>-- Выбрать --</option>
                                    {allValues.filter(v => v.typeId === type.id)
                                        .map(v => (
                                            <option key={v.id} value={v.id} className={style.categoryOptions}>{v.categoryValue}</option>
                                        ))
                                    }
                                    {/*{errors.categories && <span className={style.errorMessage}>{errors.categories}</span>}*/}
                                </select>
                            </div>
                        ))}

                    </div>
                </div>
                </div>

                {/* НИЖНИЕ БЛОКИ */}

                {/*     ИНГРЕДИЕНТЫ      */}
                {/* Для блоков ингредиентов и категорий можно подсвечивать заголовки секций */}
                <div className={style.fullWidthSection}>
                    <h3 className={`${style.sectionTitle} ${errors.ingredients ? style.errorSection : ''}`}>
                        * Ингредиенты
                    </h3>
                    {errors.ingredients && <span className={style.errorMessage}>{errors.ingredients}</span>}

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
                                        <option key={unit.id} value={unit.id ?? "" }>{unit.label}</option>
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

                {/*/!*     Время приготовления *!/*/}
                {/*<div className={style.formGroup}>*/}
                {/*    <label>Время приготовления</label>*/}
                {/*    <div style={{ display:'flex', gap: '15px', alignItems:'center'}}>*/}
                {/*        <div style={{ display:'flex', alignItems: 'center', gap: '5px'}}>*/}
                {/*            <input*/}
                {/*                type='number'*/}
                {/*                min="0"*/}
                {/*                max="72"*/}
                {/*                placeholder='0'*/}
                {/*                value={hours}*/}
                {/*                onChange={(e) => setHours(e.target.value ? Number(e.target.value) : '')}*/}
                {/*                style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}*/}
                {/*            />*/}
                {/*            <span> ч</span>*/}
                {/*        </div>*/}

                {/*        <div style={{ display:'flex', alignItems: 'center', gap: '5px'}}>*/}
                {/*            <input*/}
                {/*                type='number'*/}
                {/*                min="0"*/}
                {/*                max="59"*/}
                {/*                placeholder='0'*/}
                {/*                value={minutes}*/}
                {/*                onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : '')}*/}
                {/*                style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}*/}
                {/*            />*/}
                {/*            <span> мин</span>*/}
                {/*        </div>*/}

                {/*    </div>*/}
                {/*</div>*/}

                {/*     ШАГИ     */}
                <div className={style.fullWidthSection}>
                    <h3 className={`${style.sectionTitle} ${errors.steps ? style.errorSection : ''}`}>
                        * Шаги приготовления
                    </h3>
                    {errors.steps && <span className={style.errorMessage}>{errors.steps}</span>}

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