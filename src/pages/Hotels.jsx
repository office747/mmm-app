import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useSupabase } from '../hooks/useSupabase.js'
import { useSave } from '../hooks/useSave.js'
import { useSaveToast, SaveToast } from '../components/ui/index.jsx'
import { syncHotelToHubspot } from '../lib/n8n/index.js'
import HotelList from '../components/hotels/HotelList.jsx'
import HotelModal from '../components/hotels/HotelModal.jsx'

export default function Hotels() {
  const [modalOpen, setModalOpen]   = useState(false)
  const [editHotel, setEditHotel]   = useState(null)
  const [editContacts, setContacts] = useState([])
  const { showToast, toastVisible } = useSaveToast()

  const { data: hotels, loading, refetch } = useSupabase(
    () => supabase.from('hotels').select('*').order('name'),
    []
  )

  const { save, saving, saveError, clearError } = useSave(
    async ({ hotel, contacts }) => {
      const { id, ...fields } = hotel

      // upsert hotel
      const { data: saved, error } = id
        ? await supabase.from('hotels').update(fields).eq('id', id).select().single()
        : await supabase.from('hotels').insert(fields).select().single()
      if (error) throw error

      // replace contacts
      await supabase.from('hotel_contacts').delete().eq('hotel_id', saved.id)
      if (contacts.length) {
        await supabase.from('hotel_contacts').insert(
          contacts.map((c, i) => ({ ...c, hotel_id: saved.id, is_primary: i === 0 }))
        )
      }

      return { data: saved, error: null }
    },
    {
      onSuccess: async (saved) => {
        setModalOpen(false)
        refetch()
        showToast()
        const action = editHotel?.id ? 'updated' : 'created'
        syncHotelToHubspot(saved, action).catch(err =>
          console.warn('HubSpot hotel sync failed:', err.message)
        )
        setEditHotel(null)
        setContacts([])
      }
    }
  )

  const openAdd = () => { setEditHotel(null); setContacts([]); setModalOpen(true) }

  const openEdit = async (hotel) => {
    const { data: contacts } = await supabase
      .from('hotel_contacts')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('is_primary', { ascending: false })
    setEditHotel(hotel)
    setContacts(contacts || [])
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditHotel(null); setContacts([]); clearError() }

  return (
    <div className="page">
      <HotelList
        hotels={hotels || []}
        loading={loading}
        onAdd={openAdd}
        onEdit={openEdit}
      />

      <HotelModal
        open={modalOpen}
        hotel={editHotel}
        contacts={editContacts}
        onSave={save}
        onClose={closeModal}
        saving={saving}
        saveError={saveError}
        onClearError={clearError}
      />

      {toastVisible && <SaveToast message={editHotel ? 'Hotel updated' : 'Hotel added'} />}
    </div>
  )
}
