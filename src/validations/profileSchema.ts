import * as Yup from 'yup';

export const profileSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .max(100, 'Name must be 100 characters or less'),
  bio: Yup.string(),
  location: Yup.string(),
});

export type ProfileFormData = Yup.InferType<typeof profileSchema>; 