import PollCard from '../components/PollCard'
import SectionHeader from '../components/SectionHeader'
import { usePublishedCollection } from '../hooks/useFirestore'

export default function PollsPage() {
  const { docs: polls, loading } = usePublishedCollection('polls', 50)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionHeader title="Anketler" subtitle="Görüşünüz Önemli" />
      <p className="text-slate-500 mb-8">Topluluğumuzla ilgili kararlar almamıza yardımcı olmak için anketlere katılın.</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-xl" />)}
        </div>
      ) : polls.length === 0 ? (
        <p className="text-center text-slate-400 py-20 text-lg">Aktif anket yok.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map(poll => <PollCard key={poll.id} poll={poll} />)}
        </div>
      )}
    </div>
  )
}
