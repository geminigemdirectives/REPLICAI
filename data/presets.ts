
import { AttributeKey } from '../types';

export interface PresetOption {
  id: string;
  label: string;
  prompt: string;
  tags?: string[];
}

export interface PresetCategory {
  id: string;
  label: string;
  options: PresetOption[];
}

export const HAIR_COLORS = {
  natural: [
    "Black", "Dark Brown", "Medium Brown", "Light Brown", "Dark Blonde", "Blonde", "Auburn", "Chestnut", "Gray", "White"
  ],
  dyed: [
    "Platinum", "Ash Blonde", "Silver", "Red", "Ginger", "Burgundy", "Pink", "Blue", "Purple", "Green", "Pastel tones"
  ]
};

export const PRESETS: Record<AttributeKey, PresetCategory[]> = {
  camera: [
    {
      id: 'focal_length',
      label: 'Focal Lengths',
      options: [
        { id: '50mm', label: '50mm (Standard)', prompt: '50mm lens, natural field of view, realistic depth, minimal distortion.' },
        { id: '35mm', label: '35mm (Street)', prompt: '35mm lens, slight context visible, storytelling perspective, sharp.' },
        { id: '85mm', label: '85mm (Portrait)', prompt: '85mm lens, flattering facial compression, creamy bokeh, isolated subject.' },
        { id: '24mm', label: '24mm (Wide)', prompt: '24mm lens, wide angle, environmental context, dynamic lines.' }
      ]
    },
    {
      id: 'shot_type',
      label: 'Shot Types',
      options: [
        { id: 'cinematic', label: 'Cinematic Medium', prompt: 'Cinematic medium shot, professional lighting, anamorphic aspect ratio vibes.' },
        { id: 'closeup', label: 'Extreme Close-up', prompt: 'Extreme close-up, macro details on eyes and skin texture, intense focus.' },
        { id: 'selfie', label: 'Selfie POV', prompt: 'Smartphone front camera angle, arm extended perspective, casual framing.' }
      ]
    }
  ],
  pose: [
    {
      id: 'energy',
      label: 'Energy Levels',
      options: [
        { id: 'calm', label: 'Calm / Static', prompt: 'Standing still, relaxed posture, minimal movement, grounded.' },
        { id: 'dynamic', label: 'Dynamic / Motion', prompt: 'Walking towards camera, hair flowing in wind, active energy.' },
        { id: 'relaxed', label: 'Relaxed / Seated', prompt: 'Sitting comfortably, leaning back, relaxed limbs, casual vibe.' }
      ]
    },
    {
      id: 'style',
      label: 'Posing Style',
      options: [
        { id: 'candid', label: 'Candid', prompt: 'Caught off-guard, looking away or laughing, natural body language, not posing.' },
        { id: 'editorial', label: 'Fashion Editorial', prompt: 'High-fashion pose, angular shapes, confident stance, model behavior.' }
      ]
    }
  ],
  outfit: [
    {
      id: 'casual',
      label: 'Casual Wear',
      options: [
        { id: 'modern', label: 'Modern Basic', prompt: 'Fitted white t-shirt, high-waisted denim jeans, minimalist sneakers.' },
        { id: 'cozy', label: 'Cozy Knitwear', prompt: 'Oversized knit sweater, leggings, comfortable autumn vibe.' },
        { id: 'summer', label: 'Summer Breeze', prompt: 'Light sundress, floral pattern, thin straps, airy fabric.' }
      ]
    },
    {
      id: 'formal',
      label: 'Formal / Chic',
      options: [
        { id: 'evening', label: 'Evening Gown', prompt: 'Elegant silk evening gown, floor length, draped silhouette, luxury fabric.' },
        { id: 'suit', label: 'Tailored Suit', prompt: 'Sharp tailored blazer, matching trousers, crisp button-down, power dressing.' },
        { id: 'cocktail', label: 'Cocktail Attire', prompt: 'Chic cocktail dress, mid-length, sophisticated texture, heels.' }
      ]
    },
    {
      id: 'street',
      label: 'Street Style',
      options: [
        { id: 'urban', label: 'Urban Hype', prompt: 'Oversized hoodie, cargo pants, chunky sneakers, layered streetwear.' },
        { id: 'leather', label: 'Edgy Leather', prompt: 'Black leather jacket, band tee, distressed black jeans, boots.' }
      ]
    }
  ],
  body: [
    {
      id: 'build',
      label: 'Body Build',
      options: [
        { id: 'average', label: 'Average', prompt: 'Average build, realistic proportions, healthy appearance.' },
        { id: 'athletic', label: 'Athletic', prompt: 'Athletic fit build, toned muscle definition, energetic physique.' },
        { id: 'slim', label: 'Slim', prompt: 'Slim slender build, lean silhouette, delicate frame.' },
        { id: 'curvy', label: 'Curvy', prompt: 'Curvy full figure, hourglass silhouette, soft shapes, voluptuous.' }
      ]
    }
  ],
  hair: [
    {
      id: 'style',
      label: 'Hair Structure',
      options: [
        { id: 'straight', label: 'Straight Long', prompt: 'Long straight hair, sleek texture, shiny finish, center part.' },
        { id: 'wavy', label: 'Natural Waves', prompt: 'Natural wavy hair texture, voluminous, soft movement, beach wave style.' },
        { id: 'curly', label: 'Defined Curls', prompt: 'Voluminous curly hair, defined ringlets, rich texture, natural bounce.' },
        { id: 'bob', label: 'Chic Bob', prompt: 'Short chin-length bob cut, sharp lines, modern style.' },
        { id: 'updo', label: 'Messy Updo', prompt: 'Casual messy bun, loose strands framing face, relaxed neck visibility.' }
      ]
    }
  ],
  expression: [
    {
      id: 'mood',
      label: 'Emotional Mood',
      options: [
        { id: 'neutral', label: 'Neutral', prompt: 'Calm neutral expression, relaxed facial muscles, soft gaze.' },
        { id: 'happy', label: 'Happy / Smile', prompt: 'Genuine warm smile, showing teeth slightly, crinkling eyes, approachable.' },
        { id: 'fierce', label: 'Fierce / Smize', prompt: 'Fierce model gaze, smiling with eyes (smize), intense connection, slight pout.' },
        { id: 'pensive', label: 'Pensive', prompt: 'Thoughtful expression, looking away slightly, contemplative mood.' }
      ]
    }
  ],
  scene: [
    {
      id: 'indoor',
      label: 'Indoor',
      options: [
        { id: 'studio', label: 'Photo Studio', prompt: 'Professional studio background, solid color wall, controlled lighting.' },
        { id: 'cafe', label: 'Coffee Shop', prompt: 'Cozy cafe interior, blurred tables, warm ambient lighting, coffee shop details.' },
        { id: 'bedroom', label: 'Modern Bedroom', prompt: 'Clean modern bedroom, soft morning light, messy bed sheets, lived-in vibe.' },
        { id: 'living', label: 'Living Room', prompt: 'Stylish living room, contemporary furniture, window light.' }
      ]
    },
    {
      id: 'outdoor',
      label: 'Outdoor',
      options: [
        { id: 'city', label: 'City Street', prompt: 'Bustling city street, urban architecture, concrete textures, daylight.' },
        { id: 'nature', label: 'Park / Nature', prompt: 'Green park setting, trees, grass, soft organic bokeh, natural sunlight.' },
        { id: 'golden', label: 'Golden Hour', prompt: 'Outdoor setting during golden hour, warm flare, sun dipping low.' }
      ]
    }
  ]
};
