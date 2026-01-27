
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Library, Search, MoreVertical, GraduationCap, Loader2, X, Save, Pencil, Trash2, AlertTriangle, BookOpen, ListTree, MapPin, FileText, Sparkles, CheckCircle2, Cpu, UserCheck, ChevronDown } from 'lucide-react';
import { StudyCourse } from '../types';
import { api } from '../services/api';
import { GoogleGenAI, Type } from "@google/genai";

interface StudyCoursesProps {
  onSelectCourse: (course: StudyCourse) => void;
}

export const StudyCourses: React.FC<StudyCoursesProps> = ({ onSelectCourse }) => {
  const [courses, setCourses] = useState<StudyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; course: StudyCourse | null }>({ isOpen: false, course: null });
  const menuRef = useRef<HTMLDivElement>(null);

  // AI & Upload State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isAnalyzingPositions, setIsAnalyzingPositions] = useState(false);
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const [formData, setFormData] = useState({ id: '', name: '', category: 'Geral', localEstudo: '', status: 'Em andamento' as any });

  useEffect(() => {
    loadCourses();
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await api.getStudyCourses();
      setCourses(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setAvailablePositions([]);
      setSelectedPosition('');
      setIsAnalyzingPositions(true);
      try {
        const base64Data = await fileToBase64(file);
        // CRITICAL: Initialization uses process.env.API_KEY directly as per guidelines
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          // Fix: Following recommended multi-part turn structure from guidelines
          contents: {
            parts: [
              { inlineData: { mimeType: "application/pdf", data: base64Data } },
              { text: "Analise este edital e identifique todos os CARGOS, FUNÇÕES ou ESPECIALIDADES disponíveis. Ignore cabeçalhos e rodapés. Retorne apenas um JSON puro com um array de strings ['Cargo A', 'Cargo B']." }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        });
        const positions = JSON.parse(response.text || "[]");
        setAvailablePositions(positions);
        if (positions.length > 0) setSelectedPosition(positions[0]);
      } catch (error) {
        console.error("Erro ao ler cargos:", error);
      } finally {
        setIsAnalyzingPositions(false);
      }
    }
  };

  const processEditalWithAI = async (courseId: string) => {
    if (!pdfFile || !selectedPosition) return;

    try {
      setAnalysisStep(1);
      setAnalysisProgress(20);
      const base64Data = await fileToBase64(pdfFile);

      setAnalysisStep(2);
      setAnalysisProgress(50);
      // CRITICAL: Initialization uses process.env.API_KEY directly as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        // Fix: Following recommended multi-part turn structure from guidelines
        contents: {
          parts: [
            { inlineData: { mimeType: "application/pdf", data: base64Data } },
            { text: `Sua tarefa é realizar a VERTICALIZAÇÃO PRECISA do edital para o cargo: "${selectedPosition}".

REGRAS CRÍTICAS DE EXTRAÇÃO:
1. IDENTIFICAÇÃO DE DISCIPLINAS: Não aceite títulos genéricos como 'CONHECIMENTOS ESPECÍFICOS' como nome de disciplina. Procure dentro desse bloco as matérias reais (ex: Direito Administrativo, Direito Constitucional, Contabilidade, etc.).
2. SEPARAÇÃO DE TÓPICOS: Quando encontrar uma matéria seguida de parênteses ou vírgulas (ex: 'Português: Gramática, interpretação de texto...'), a parte antes dos dois pontos ou parênteses é a DISCIPLINA. O que segue são os TÓPICOS.
3. GRANULARIDADE: Cada item numerado ou separado por vírgula dentro de uma matéria deve ser um tópico individual no array.
4. LIMPEZA: Remova termos como 'noções de', 'conhecimentos sobre', 'compreensão de'.
5. ESTRUTURA: Retorne um JSON no formato: Array<{ discipline: string, topics: string[] }>.

Seja extremamente detalhista. Se uma matéria 'Direito Penal' estiver dentro de um parágrafo gigante chamado 'Conhecimentos Gerais', separe 'Direito Penal' como uma disciplina nova.` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                discipline: { type: Type.STRING },
                topics: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["discipline", "topics"]
            }
          }
        }
      });

      const syllabus: Array<{ discipline: string, topics: string[] }> = JSON.parse(response.text || "[]");
      
      setAnalysisStep(3);
      setAnalysisProgress(80);

      for (const item of syllabus) {
        if (item.topics.length === 0) continue;
        
        const disc: any = await api.addStudyDiscipline({ 
          courseId, 
          name: item.discipline, 
          professor: 'IA Babylon' 
        });
        
        if (disc && disc.id_disciplina) {
          for (const topicName of item.topics) {
            await api.addStudyTopic({
              disciplineId: disc.id_disciplina,
              name: topicName,
              prioridade: 'Média'
            });
          }
        }
      }

      setAnalysisProgress(100);
    } catch (error) {
      console.error("AI Analysis Error:", error);
    } finally {
      setAnalysisStep(0);
    }
  };

  const handleEdit = (course: StudyCourse) => {
    setFormData({ id: course.id, name: course.name, category: course.category || 'Geral', localEstudo: course.localEstudo || '', status: course.status });
    setPdfFile(null); setAvailablePositions([]); setSelectedPosition(''); setIsModalOpen(true); setOpenMenuId(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.course) return;
    setIsSubmitting(true);
    try {
      await api.deleteStudyCourse(deleteConfirm.course.id);
      setDeleteConfirm({ isOpen: false, course: null });
      loadCourses();
    } catch (e) { alert("Erro ao excluir curso."); }
    finally { setIsSubmitting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || isSubmitting) return;
    setIsSubmitting(true);
    try {
      let course;
      if (formData.id) {
        course = await api.updateStudyCourse(formData.id, formData);
      } else {
        const finalName = selectedPosition ? `${formData.name} - ${selectedPosition}` : formData.name;
        course = await api.addStudyCourse({ ...formData, name: finalName });
        if (pdfFile && course && course.id_curso) {
          await processEditalWithAI(course.id_curso);
        }
      }
      setIsModalOpen(false); 
      setPdfFile(null); 
      setAvailablePositions([]); 
      setAnalysisStep(0); 
      loadCourses();
    } catch (e) { 
      console.error(e);
      alert("Erro ao salvar curso. Verifique se preencheu todos os campos obrigatórios."); 
    }
    finally { setIsSubmitting(false); }
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Library className="text-white" size={20} />
            </div>
            Meus Cursos
          </h2>
          <p className="text-gray-500 text-sm mt-1 ml-[52px]">Gerencie suas disciplinas e materiais de estudo</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              placeholder="Buscar curso..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button 
            onClick={() => { 
              setFormData({ id: '', name: '', category: 'Geral', localEstudo: '', status: 'Em andamento' }); 
              setPdfFile(null); 
              setAvailablePositions([]); 
              setSelectedPosition(''); 
              setIsModalOpen(true); 
            }} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            <Plus size={20} /> Novo Curso
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
              <Library size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-sm font-medium text-gray-500">Nenhum curso cadastrado ainda.</p>
              <p className="text-xs text-gray-400 mt-2">Clique em "Novo Curso" para começar</p>
            </div>
          ) : filteredCourses.map(course => (
            <div 
              key={course.id} 
              className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-indigo-400 hover:shadow-xl transition-all group"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-5">
                <div 
                  onClick={() => onSelectCourse(course)} 
                  className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center cursor-pointer group-hover:scale-110 transition-transform shadow-lg"
                >
                  <GraduationCap className="text-white" size={28} />
                </div>
                
                <div className="relative" ref={openMenuId === course.id ? menuRef : null}>
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)} 
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {openMenuId === course.id && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl border-2 border-gray-200 shadow-xl z-50 overflow-hidden">
                      <button 
                        onClick={() => handleEdit(course)} 
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                      >
                        <Pencil size={16} /> Editar
                      </button>
                      <button 
                        onClick={() => { setDeleteConfirm({ isOpen: true, course }); setOpenMenuId(null); }} 
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 transition-colors"
                      >
                        <Trash2 size={16} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
                  {course.category}
                </span>
                {course.localEstudo && (
                  <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1">
                    <MapPin size={12} /> {course.localEstudo}
                  </span>
                )}
              </div>

              {/* Course Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {course.name}
              </h3>

              {/* Status */}
              <div className="flex items-center gap-2 mb-5">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  course.status === 'Concluído' ? 'bg-emerald-500' : 
                  course.status === 'Pausado' ? 'bg-amber-500' : 'bg-blue-500'
                }`}></div>
                <span className="text-xs font-medium text-gray-600">{course.status}</span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-5 border-t border-gray-100">
                <button 
                  onClick={() => onSelectCourse(course)} 
                  className="flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg font-semibold text-sm hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <BookOpen size={16} /> Disciplinas
                </button>
                <button 
                  onClick={() => onSelectCourse(course)} 
                  className="flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-600 rounded-lg font-semibold text-sm hover:bg-purple-600 hover:text-white transition-all"
                >
                  <ListTree size={16} /> Tópicos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 w-full max-w-2xl overflow-hidden relative">
            
            {/* AI Processing Overlay */}
            {analysisStep > 0 && (
              <div className="absolute inset-0 z-[60] bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center p-10 text-white text-center space-y-8">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-white/20 rounded-full animate-spin border-t-white"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cpu size={40} className="text-white animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold">Processamento IA Ativo</h4>
                  <p className="text-sm font-medium text-white/70">
                    {analysisStep === 1 ? 'Lendo edital...' : 
                     analysisStep === 2 ? `Analisando ${selectedPosition}...` : 
                     analysisStep === 3 ? 'Criando estrutura pedagógica...' : 'Finalizando...'}
                  </p>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden max-w-xs">
                  <div 
                    className="h-full bg-white transition-all duration-500 rounded-full" 
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">
                {formData.id ? 'Editar Curso' : 'Novo Curso'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Nome do Concurso / Instituição</label>
                <input 
                  required 
                  autoFocus 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Ex: GCM São Paulo, PC-SP..." 
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium text-gray-900 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Categoria</label>
                  <input 
                    required 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    placeholder="Ex: Segurança, Jurídico..." 
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium text-gray-900 outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as any})} 
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium text-gray-900 outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Pausado">Pausado</option>
                  </select>
                </div>
              </div>

              {/* AI Edital Upload */}
              {!formData.id && (
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        pdfFile ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : 'bg-white text-gray-400'
                      }`}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-indigo-900 block">Upload de Edital</span>
                        <p className="text-xs text-indigo-600 font-medium">Inteligência Artificial Babylon</p>
                      </div>
                    </div>
                    {pdfFile && !isAnalyzingPositions && (
                      <button 
                        type="button" 
                        onClick={() => { setPdfFile(null); setAvailablePositions([]); setSelectedPosition(''); }} 
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                  
                  {!availablePositions.length && !isAnalyzingPositions ? (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={handleFileChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="py-8 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:bg-white/50 transition-all bg-white/30">
                        <Plus size={32} className="text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-900">Selecionar Edital PDF</span>
                        <span className="text-xs text-indigo-600">Análise automática com IA</span>
                      </div>
                    </div>
                  ) : isAnalyzingPositions ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="text-indigo-600 animate-spin" size={32} />
                      <span className="text-sm font-semibold text-indigo-900">Identificando cargos...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                        <CheckCircle2 size={18} /> {availablePositions.length} cargos encontrados
                      </div>
                      <div className="relative">
                        <select 
                          value={selectedPosition} 
                          onChange={e => setSelectedPosition(e.target.value)} 
                          className="w-full appearance-none px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-indigo-500"
                        >
                          {availablePositions.map((pos, i) => (
                            <option key={i} value={pos}>{pos}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting || isAnalyzingPositions} 
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <Save size={20} /> {formData.id ? 'Salvar Alterações' : 'Criar Curso'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Excluir Curso?</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              Ao excluir o curso <span className="font-bold text-gray-900">"{deleteConfirm.course?.name}"</span>, 
              todos os dados relacionados serão perdidos permanentemente.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDelete} 
                disabled={isSubmitting} 
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Sim, Excluir'}
              </button>
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, course: null })} 
                className="w-full py-3 text-gray-600 hover:bg-gray-100 font-semibold rounded-xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
