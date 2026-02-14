import type { ReportTemplate } from '../../types/report';

type Props = {
  templates: ReportTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ReportTemplateLibrary({ templates, selectedId, onSelect }: Props) {
  return (
    <section className='space-y-3'>
      <h3 className='text-lg font-semibold'>Template Library</h3>
      <div className='grid md:grid-cols-2 gap-3'>
        {templates.map((template) => (
          <button
            key={template.id}
            className={`text-left glass rounded-xl border p-4 ${selectedId === template.id ? 'border-secondary' : 'border-white/10'}`}
            onClick={() => onSelect(template.id)}
          >
            <p className='font-medium'>{template.name}</p>
            <p className='text-sm text-white/70'>{template.description}</p>
            <p className='text-xs text-white/60 mt-2'>Type: {template.type}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
