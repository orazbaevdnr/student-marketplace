import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, PlusCircle, AlertCircle } from 'lucide-react';
import { api, Category, Condition, Listing } from '../api';
import { useAuth } from '../auth/AuthContext';
import { strings } from '../i18n/strings';
import { validateLength } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ImageUploader } from '../components/listings/ImageUploader';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  condition?: string;
  contact?: string;
  images?: string;
}

export const ListingForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<Category>('textbooks');
  const [condition, setCondition] = useState<Condition>('good');
  const [contact, setContact] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(isEditMode);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Load existing listing in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      setIsLoadingExisting(true);
      api
        .getListing(id)
        .then((data: Listing | null) => {
          if (!data) {
            toast.error('Listing not found');
            navigate('/my-listings');
            return;
          }
          if (user && data.sellerId !== user.id) {
            toast.error('You do not have permission to edit this listing.');
            navigate('/');
            return;
          }
          setTitle(data.title);
          setDescription(data.description);
          setPrice(String(data.price));
          setCategory(data.category);
          setCondition(data.condition);
          setContact(data.contact || '');
          setImages(data.images || []);
        })
        .catch(() => {
          toast.error('Failed to load listing for editing');
          navigate('/my-listings');
        })
        .finally(() => {
          setIsLoadingExisting(false);
        });
    } else if (user) {
      // Pre-fill contact with telegram or email for convenience
      setContact(user.telegram || user.email || '');
    }
  }, [id, isEditMode, user, navigate, toast]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    const titleCheck = validateLength(title, 3, 80);
    if (!titleCheck.valid) {
      errs.title = titleCheck.error || 'Title must be 3-80 characters';
    }

    const descCheck = validateLength(description, 10, 1000);
    if (!descCheck.valid) {
      errs.description = descCheck.error || 'Description must be 10-1000 characters';
    }

    const numPrice = Number(price);
    if (price === '' || isNaN(numPrice) || numPrice < 0) {
      errs.price = 'Please enter a valid price (0 or higher)';
    }

    if (!category) {
      errs.category = 'Please select a category';
    }

    if (!condition) {
      errs.condition = 'Please select an item condition';
    }

    if (!contact.trim()) {
      errs.contact = 'Please provide a contact method (Telegram handle or email)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form.');
      return;
    }
    if (!user) {
      toast.error('You must be logged in to post.');
      return;
    }

    setIsSubmitting(true);
    try {
      // If no images uploaded, use a random aesthetic placeholder
      const finalImages =
        images.length > 0
          ? images
          : [`https://picsum.photos/seed/${encodeURIComponent(title.slice(0, 10))}/600/450`];

      if (isEditMode && id) {
        const updated = await api.updateListing(id, {
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          category,
          condition,
          contact: contact.trim(),
          images: finalImages,
        });
        toast.success(strings.listingForm.updateSuccess);
        setIsDirty(false);
        navigate(`/listing/${updated.id}`);
      } else {
        const created = await api.createListing({
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          category,
          condition,
          contact: contact.trim(),
          images: finalImages,
          sellerId: user.id,
          seller: {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            faculty: user.faculty,
          },
        });
        toast.success(strings.listingForm.createSuccess);
        setIsDirty(false);
        navigate(`/listing/${created.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      navigate(-1);
    }
  };

  if (isLoadingExisting) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-sm text-slate-500 font-medium">Loading listing details...</p>
      </div>
    );
  }

  const categoryOptions = [
    { value: 'textbooks', label: strings.catalog.categories.textbooks },
    { value: 'electronics', label: strings.catalog.categories.electronics },
    { value: 'furniture', label: strings.catalog.categories.furniture },
    { value: 'clothes', label: strings.catalog.categories.clothes },
    { value: 'dorm_home', label: strings.catalog.categories.dorm_home },
    { value: 'sports', label: strings.catalog.categories.sports },
    { value: 'other', label: strings.catalog.categories.other },
  ];

  const conditionOptions = [
    { value: 'new', label: `${strings.catalog.conditions.new} (Never opened or used)` },
    { value: 'like_new', label: `${strings.catalog.conditions.like_new} (Flawless, almost no wear)` },
    { value: 'good', label: `${strings.catalog.conditions.good} (Minor signs of use, fully functional)` },
    { value: 'fair', label: `${strings.catalog.conditions.fair} (Noticeable wear, still usable)` },
  ];

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? strings.listingForm.editTitle : strings.listingForm.createTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {strings.listingForm.subtitle}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6"
      >
        {/* Title */}
        <Input
          label={strings.listingForm.titleLabel}
          placeholder={strings.listingForm.titlePlaceholder}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          helperText={strings.listingForm.titleHelp}
          error={errors.title}
          required
        />

        {/* Category & Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={strings.listingForm.categoryLabel}
            options={categoryOptions}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category);
              markDirty();
            }}
            error={errors.category}
            required
          />

          <Select
            label={strings.listingForm.conditionLabel}
            options={conditionOptions}
            value={condition}
            onChange={(e) => {
              setCondition(e.target.value as Condition);
              markDirty();
            }}
            error={errors.condition}
            required
          />
        </div>

        {/* Price & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={strings.listingForm.priceLabel}
            type="number"
            min="0"
            step="1"
            placeholder={strings.listingForm.pricePlaceholder}
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              markDirty();
            }}
            helperText="Set 0 for free giveaways"
            error={errors.price}
            required
          />

          <Input
            label={strings.listingForm.contactLabel}
            placeholder={strings.listingForm.contactPlaceholder}
            value={contact}
            onChange={(e) => {
              setContact(e.target.value);
              markDirty();
            }}
            helperText={strings.listingForm.contactHelp}
            error={errors.contact}
            required
          />
        </div>

        {/* Photos Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {strings.listingForm.photosLabel}
          </label>
          <ImageUploader
            images={images}
            onChange={(imgs) => {
              setImages(imgs);
              markDirty();
            }}
            maxImages={5}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            {strings.listingForm.photosHelp}
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {strings.listingForm.descriptionLabel} <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
            placeholder={strings.listingForm.descriptionPlaceholder}
            className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              errors.description
                ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-200'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
            }`}
          />
          {errors.description ? (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {errors.description}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500">
              {strings.listingForm.descriptionHelp} ({description.length} chars)
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {strings.listingForm.cancelBtn}
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            size="md"
            leftIcon={isEditMode ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          >
            {isEditMode ? strings.listingForm.saveChangesBtn : strings.listingForm.publishBtn}
          </Button>
        </div>
      </form>

      {/* Discard Changes Modal */}
      <Modal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title={strings.listingForm.unsavedChangesTitle}
        description={strings.listingForm.unsavedChangesDesc}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDiscardModal(false)}
            >
              {strings.listingForm.stayBtn}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowDiscardModal(false);
                setIsDirty(false);
                navigate(-1);
              }}
            >
              {strings.listingForm.discardBtn}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Any information or photos you have entered will not be saved.
        </p>
      </Modal>
    </div>
  );
};
