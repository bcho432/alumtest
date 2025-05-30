import { Input } from './Input';
import { Icon } from './Icon';

interface SocialMediaLinks {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
}

interface SocialMediaLinksProps {
  links?: SocialMediaLinks;
  onChange: (links: SocialMediaLinks) => void;
}

export function SocialMediaLinks({ links = {}, onChange }: SocialMediaLinksProps) {
  const handleChange = (platform: keyof SocialMediaLinks, value: string) => {
    onChange({
      ...links,
      [platform]: value
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Twitter
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="twitter" className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            value={links.twitter || ''}
            onChange={(e) => handleChange('twitter', e.target.value)}
            placeholder="https://twitter.com/..."
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="linkedin" className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            value={links.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            placeholder="https://linkedin.com/company/..."
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Facebook
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="facebook" className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            value={links.facebook || ''}
            onChange={(e) => handleChange('facebook', e.target.value)}
            placeholder="https://facebook.com/..."
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instagram
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="instagram" className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            value={links.instagram || ''}
            onChange={(e) => handleChange('instagram', e.target.value)}
            placeholder="https://instagram.com/..."
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
} 