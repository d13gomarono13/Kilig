import React from 'react';
import { ComicManifest, ComicPanelData } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, RefreshCcw } from 'lucide-react';

interface ComicEditorProps {
  manifest: ComicManifest;
  onChange: (newManifest: ComicManifest) => void;
  selectedPanelId: string | null;
  onSelectPanel: (id: string | null) => void;
  onRefresh?: () => void;
}

export const ComicEditor: React.FC<ComicEditorProps> = ({ manifest, onChange, selectedPanelId, onSelectPanel, onRefresh }) => {

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...manifest, title: e.target.value });
  };

  const updatePanel = (pageIndex: number, panelId: string, updates: Partial<ComicPanelData>) => {
    const newPages = [...manifest.pages];
    const page = newPages[pageIndex];
    const panelIndex = page.panels.findIndex(p => p.id === panelId);
    if (panelIndex === -1) return;

    page.panels[panelIndex] = { ...page.panels[panelIndex], ...updates };
    onChange({ ...manifest, pages: newPages });
  };

  const deletePanel = (pageIndex: number, panelId: string) => {
      const newPages = [...manifest.pages];
      newPages[pageIndex].panels = newPages[pageIndex].panels.filter(p => p.id !== panelId);
      onChange({ ...manifest, pages: newPages });
  };

  const addPanel = (pageIndex: number) => {
    const newPages = [...manifest.pages];
    const id = `panel-${Date.now()}`;
    newPages[pageIndex].panels.push({
        id,
        type: 'static',
        title: 'New Panel',
        content: 'Content goes here...',
        layout: { x: 1, y: 1, w: 2, h: 2 }
    });
    onChange({ ...manifest, pages: newPages });
    onSelectPanel(id);
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <div className="p-4 border-b-4 border-black flex items-center justify-between">
        <div className="flex-1 mr-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Comic Title</Label>
          <Input 
            value={manifest.title} 
            onChange={handleTitleChange} 
            className="font-bold text-lg border-transparent hover:border-input focus:border-input px-0 h-auto"
          />
        </div>
        {onRefresh && (
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onRefresh} title="Reload AI Manifest">
            <RefreshCcw size={14} />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
          {manifest.pages.map((page, pageIndex) => (
              <div key={page.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Page {pageIndex + 1}</h3>
                      <Button variant="outline" size="sm" onClick={() => addPanel(pageIndex)}>
                          <Plus size={14} className="mr-1"/> Add Panel
                      </Button>
                  </div>

                  <div className="space-y-4">
                      {page.panels.map((panel, i) => (
                          <Card 
                              key={panel.id} 
                              className={`cursor-pointer transition-colors group ${selectedPanelId === panel.id ? 'border-blue-500 bg-blue-50/50' : 'hover:border-gray-400'}`}
                              onClick={() => onSelectPanel(panel.id)}
                          >
                              <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
                                  <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                                      <Input 
                                          value={panel.title || ''} 
                                          onChange={(e) => updatePanel(pageIndex, panel.id, { title: e.target.value })}
                                          className="h-7 text-sm font-semibold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent"
                                          placeholder="Untitled Panel"
                                      />
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deletePanel(pageIndex, panel.id); }}>
                                      <Trash2 size={12}/>
                                  </Button>
                              </CardHeader>
                              <CardContent className="p-3 pt-2 space-y-3">
                                  {/* TYPE SELECTOR */}
                                  <div className="grid grid-cols-2 gap-2">
                                      <div>
                                          <Label className="text-[10px]">Type</Label>
                                          <select 
                                              className="w-full text-xs border rounded h-7 bg-background px-2"
                                              value={panel.type}
                                              onChange={(e) => updatePanel(pageIndex, panel.id, { type: e.target.value as any })}
                                          >
                                              <option value="static">Static Text</option>
                                              <option value="revideo">Revideo</option>
                                              <option value="code">Code</option>
                                          </select>
                                      </div>
                                      {/* LAYOUT GRID */}
                                      <div className="grid grid-cols-4 gap-1">
                                          <div><Label className="text-[10px]">X</Label><Input className="h-6 text-xs px-1" type="number" value={panel.layout.x} onChange={(e) => updatePanel(pageIndex, panel.id, { layout: { ...panel.layout, x: +e.target.value } })}/></div>
                                          <div><Label className="text-[10px]">Y</Label><Input className="h-6 text-xs px-1" type="number" value={panel.layout.y} onChange={(e) => updatePanel(pageIndex, panel.id, { layout: { ...panel.layout, y: +e.target.value } })}/></div>
                                          <div><Label className="text-[10px]">W</Label><Input className="h-6 text-xs px-1" type="number" value={panel.layout.w} onChange={(e) => updatePanel(pageIndex, panel.id, { layout: { ...panel.layout, w: +e.target.value } })}/></div>
                                          <div><Label className="text-[10px]">H</Label><Input className="h-6 text-xs px-1" type="number" value={panel.layout.h} onChange={(e) => updatePanel(pageIndex, panel.id, { layout: { ...panel.layout, h: +e.target.value } })}/></div>
                                      </div>
                                  </div>

                                  {/* CONTENT EDITING */}
                                  {panel.type === 'static' && (
                                      <div className="space-y-2">
                                          <Label className="text-[10px]">Content</Label>
                                          <Textarea 
                                              value={panel.content} 
                                              onChange={(e) => updatePanel(pageIndex, panel.id, { content: e.target.value })}
                                              className="text-xs min-h-[60px]"
                                              placeholder="Panel content..."
                                          />
                                          <Label className="text-[10px]">Image URL</Label>
                                          <Input 
                                              value={panel.imageUrl || ''} 
                                              onChange={(e) => updatePanel(pageIndex, panel.id, { imageUrl: e.target.value })}
                                              className="h-7 text-xs"
                                              placeholder="https://..."
                                          />
                                      </div>
                                  )}
                                  {panel.type === 'code' && (
                                      <Textarea 
                                          value={panel.codeSnippet?.code} 
                                          onChange={(e) => updatePanel(pageIndex, panel.id, { codeSnippet: { language: panel.codeSnippet?.language || 'python', code: e.target.value } })}
                                          className="text-xs font-mono bg-slate-50 min-h-[80px]"
                                          placeholder="print('hello')"
                                      />
                                  )}
                                  {panel.type === 'revideo' && (
                                      <div className="space-y-2">
                                          <div>
                                              <Label className="text-[10px]">Template ID</Label>
                                              <Input 
                                                  value={panel.revideo?.templateId} 
                                                  onChange={(e) => updatePanel(pageIndex, panel.id, { revideo: { ...panel.revideo!, templateId: e.target.value } })}
                                                  className="h-7 text-xs"
                                              />
                                          </div>
                                      </div>
                                  )}
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              </div>
          ))}
      </ScrollArea>
    </div>
  );
};
