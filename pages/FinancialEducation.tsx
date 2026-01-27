
import React, { useState } from 'react';
import { BookOpen, Download, Eye, Search, Award, BookCheck, ArrowRight, Library, Bookmark, Share2 } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  pdfUrl: string;
  coverColor: string;
  category: string;
  year: string;
}

const PUBLIC_BOOKS: Book[] = [
  {
    id: '1',
    title: 'O Homem Mais Rico da Babilônia',
    author: 'George S. Clason',
    year: '1926',
    description: 'A base da filosofia Babylon.Fin. Ensina como manter dez moedas no bolso e apenas nove gastar, além de como multiplicar o ouro através do tempo.',
    pdfUrl: 'https://archive.org/download/o-homem-mais-rico-da-babilonia/O%20Homem%20Mais%20Rico%20da%20Babil%C3%B4nia.pdf',
    coverColor: 'bg-emerald-700',
    category: 'Finanças Pessoais'
  },
  {
    id: '2',
    title: 'A Riqueza das Nações (Livro I)',
    author: 'Adam Smith',
    year: '1776',
    description: 'A obra que fundou a economia moderna. Explica a divisão do trabalho, a acumulação de capital e o funcionamento dos mercados.',
    pdfUrl: 'https://edisciplinas.usp.br/pluginfile.php/2533606/mod_resource/content/1/Adam%20Smith%20-%20A%20Riqueza%20das%20Na%C3%A7%C3%B5es%20%28I-II%29.pdf',
    coverColor: 'bg-slate-800',
    category: 'Teoria Econômica'
  },
  {
    id: '3',
    title: 'O Caminho para a Riqueza',
    author: 'Benjamin Franklin',
    year: '1758',
    description: 'Provérbios e conselhos pragmáticos sobre diligência, parcimônia e como a economia doméstica é o segredo para a prosperidade.',
    pdfUrl: 'https://pt.wikisource.org/wiki/O_Caminho_para_a_Riqueza',
    coverColor: 'bg-indigo-900',
    category: 'Prosperidade'
  },
  {
    id: '4',
    title: 'A Ciência de Ficar Rico',
    author: 'Wallace D. Wattles',
    year: '1910',
    description: 'Um guia prático sobre como a mentalidade correta e a ação eficiente são determinantes para a criação de valor e riqueza.',
    pdfUrl: 'https://archive.org/download/sciencerich/sciencerich.pdf',
    coverColor: 'bg-amber-700',
    category: 'Mentalidade'
  },
  {
    id: '5',
    title: 'Ensaios sobre a Natureza do Comércio',
    author: 'Richard Cantillon',
    year: '1755',
    description: 'Um dos primeiros tratados sobre economia, discutindo a formação de preços, circulação monetária e o papel do empreendedor.',
    pdfUrl: 'https://edisciplinas.usp.br/pluginfile.php/4369799/mod_resource/content/0/Cantillon%20-%20Ensaio%20sobre%20a%20Natureza%20do%20Comercio%20em%20Geral.pdf',
    coverColor: 'bg-red-900',
    category: 'Economia Política'
  },
  {
    id: '6',
    title: 'Quem Pensa Enriquece',
    author: 'Napoleon Hill',
    year: '1937',
    description: 'Resultado de 20 anos de pesquisa com os homens mais bem-sucedidos da história, focando no poder da decisão e planejamento.',
    pdfUrl: 'https://archive.org/download/NapoleonHillQuemPensaEnriquece/Napoleon%20Hill%20-%20Quem%20Pensa%20Enriquece.pdf',
    coverColor: 'bg-cyan-900',
    category: 'Desenvolvimento'
  }
];

export const FinancialEducation: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBooks = PUBLIC_BOOKS.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header com Estilo de Portal de Aprendizado */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Library size={160} />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest mb-2">
              <Award size={12} /> Academia de Sabedoria Babylon
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Biblioteca de Economia</h2>
            <p className="text-slate-500 max-w-lg leading-relaxed">
              "A sabedoria é melhor que o ouro". Explore os pilares do conhecimento financeiro através de obras clássicas que resistiram ao tempo.
            </p>
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar por livro, autor ou tema..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-inner font-medium"
            />
          </div>
        </div>
      </div>

      {/* Grid de Livros com Layout de Estante Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredBooks.map((book) => (
          <div 
            key={book.id} 
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col overflow-hidden relative"
          >
            {/* "Cover" Visual de Edição Especial */}
            <div className={`${book.coverColor} h-64 relative flex flex-col items-center justify-center p-8 text-white overflow-hidden group-hover:scale-105 transition-transform duration-700`}>
              <div className="absolute top-6 left-6 flex flex-col items-start gap-1">
                <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-white/20">
                  {book.category}
                </span>
                <span className="text-[10px] font-bold opacity-60">Edição de {book.year}</span>
              </div>
              
              <div className="absolute bottom-6 right-6">
                 <Bookmark size={20} className="text-white/20 group-hover:text-white/80 transition-colors" />
              </div>

              {/* Spine Visual Effect */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/10 shadow-inner"></div>
              
              <div className="text-center relative z-10 space-y-3">
                <BookOpen size={48} className="mx-auto mb-2 opacity-50 group-hover:rotate-12 transition-transform duration-500" />
                <h3 className="font-black text-xl leading-tight uppercase tracking-tighter px-4">{book.title}</h3>
                <div className="w-12 h-0.5 bg-white/30 mx-auto"></div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{book.author}</p>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col bg-white">
              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                {book.description}
              </p>

              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <BookCheck size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Acesso Aberto</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open(book.pdfUrl, '_blank')}
                    className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100"
                    title="Aviso: Link externo"
                  >
                    <Share2 size={18} />
                  </button>
                  <a 
                    href={book.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                  >
                    Ler Agora <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <Library size={64} className="mx-auto text-slate-200 mb-6" />
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhum tesouro encontrado</h3>
          <p className="text-sm text-slate-400 mt-2">Tente buscar por termos como "Economia", "Babilônia" ou "Riqueza".</p>
        </div>
      )}

      {/* Seção de Incentivo */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-md shadow-2xl">
          <Award size={48} className="text-emerald-400" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-3">
          <h4 className="text-2xl font-black tracking-tight">O conhecimento é a melhor moeda</h4>
          <p className="text-slate-300 text-base leading-relaxed max-w-2xl">
            Arkad, o homem mais rico da Babilônia, dizia que o ouro foge de quem o investe em negócios que não conhece. Utilize estes livros para entender as leis imutáveis do dinheiro e proteja seu patrimônio.
          </p>
        </div>
        <div className="flex flex-col gap-3">
            <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap shadow-xl shadow-emerald-500/20 active:scale-95">
              Solicitar Título
            </button>
            <p className="text-[10px] text-center text-slate-500 font-bold uppercase">Baseado em Acervos Públicos</p>
        </div>
      </div>
    </div>
  );
};