import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
}

interface ProfileExperienceFormProps {
  experience?: Experience[];
  education?: Education[];
  onChange: (data: { experience?: Experience[]; education?: Education[] }) => void;
  className?: string;
}

export const ProfileExperienceForm: React.FC<ProfileExperienceFormProps> = ({
  experience = [],
  education = [],
  onChange,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'experience' | 'education'>('experience');
  const [newExperience, setNewExperience] = useState<Experience>({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [newEducation, setNewEducation] = useState<Education>({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: ''
  });

  const handleExperienceChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewExperience((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEducationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setNewEducation((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddExperience = () => {
    if (!newExperience.title || !newExperience.company || !newExperience.startDate) {
      return;
    }

    onChange({
      experience: [...experience, newExperience],
      education
    });

    setNewExperience({
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      description: ''
    });
  };

  const handleAddEducation = () => {
    if (!newEducation.institution || !newEducation.degree || !newEducation.field || !newEducation.startDate) {
      return;
    }

    onChange({
      experience,
      education: [...education, newEducation]
    });

    setNewEducation({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleRemoveExperience = (index: number) => {
    onChange({
      experience: experience.filter((_, i) => i !== index),
      education
    });
  };

  const handleRemoveEducation = (index: number) => {
    onChange({
      experience,
      education: education.filter((_, i) => i !== index)
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('experience')}
            className={cn(
              'border-b-2 py-4 text-sm font-medium',
              activeTab === 'experience'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Experience
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={cn(
              'border-b-2 py-4 text-sm font-medium',
              activeTab === 'education'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Education
          </button>
        </nav>
      </div>

      {/* Experience Form */}
      {activeTab === 'experience' && (
        <div className="space-y-6">
          {/* Existing Experience */}
          {experience.map((exp, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{exp.title}</h4>
                  <p className="text-sm text-gray-500">{exp.company}</p>
                  <p className="text-sm text-gray-500">
                    {exp.startDate} - {exp.endDate || 'Present'}
                  </p>
                  {exp.description && (
                    <p className="mt-2 text-sm text-gray-600">{exp.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(index)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Icon name="trash" className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}

          {/* New Experience Form */}
          <div className="space-y-4 rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium">Add Experience</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <Input
                  id="title"
                  name="title"
                  value={newExperience.title}
                  onChange={handleExperienceChange}
                  className="mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company
                </label>
                <Input
                  id="company"
                  name="company"
                  value={newExperience.company}
                  onChange={handleExperienceChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Date
                </label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={newExperience.startDate}
                  onChange={handleExperienceChange}
                  className="mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  End Date
                </label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={newExperience.endDate}
                  onChange={handleExperienceChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={newExperience.description}
                onChange={handleExperienceChange}
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddExperience}
                disabled={!newExperience.title || !newExperience.company || !newExperience.startDate}
              >
                Add Experience
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Education Form */}
      {activeTab === 'education' && (
        <div className="space-y-6">
          {/* Existing Education */}
          {education.map((edu, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{edu.degree}</h4>
                  <p className="text-sm text-gray-500">{edu.institution}</p>
                  <p className="text-sm text-gray-500">{edu.field}</p>
                  <p className="text-sm text-gray-500">
                    {edu.startDate} - {edu.endDate || 'Present'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(index)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Icon name="trash" className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}

          {/* New Education Form */}
          <div className="space-y-4 rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium">Add Education</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="institution"
                  className="block text-sm font-medium text-gray-700"
                >
                  Institution
                </label>
                <Input
                  id="institution"
                  name="institution"
                  value={newEducation.institution}
                  onChange={handleEducationChange}
                  className="mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="degree"
                  className="block text-sm font-medium text-gray-700"
                >
                  Degree
                </label>
                <Input
                  id="degree"
                  name="degree"
                  value={newEducation.degree}
                  onChange={handleEducationChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="field"
                className="block text-sm font-medium text-gray-700"
              >
                Field of Study
              </label>
              <Input
                id="field"
                name="field"
                value={newEducation.field}
                onChange={handleEducationChange}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="eduStartDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Date
                </label>
                <Input
                  id="eduStartDate"
                  name="startDate"
                  type="date"
                  value={newEducation.startDate}
                  onChange={handleEducationChange}
                  className="mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="eduEndDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  End Date
                </label>
                <Input
                  id="eduEndDate"
                  name="endDate"
                  type="date"
                  value={newEducation.endDate}
                  onChange={handleEducationChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddEducation}
                disabled={
                  !newEducation.institution ||
                  !newEducation.degree ||
                  !newEducation.field ||
                  !newEducation.startDate
                }
              >
                Add Education
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 