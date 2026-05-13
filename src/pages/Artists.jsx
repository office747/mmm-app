import { supabase } from '../lib/supabase.js'
import { syncArtistToHubspot } from '../lib/n8n/index.js'
import { useSupabase } from '../hooks/useSupabase.js'
import { useSave } from '../hooks/useSave.js'
import { useSaveToast, SaveToast } from '../components/ui/index.jsx'
import ArtistList from '../components/artists/ArtistList.jsx'
import ArtistModal from '../components/artists/ArtistModal.jsx'
import { useState } from 'react'

export default function Artists() {
  const [modalOpen, setModalOpen]   = useState(false)
  const [editArtist, setEditArtist] = useState(null)
  const { showToast, toastVisible } = useSaveToast()

  const { data: artists, loading, error, refetch } = useSupabase(
    () => supabase.from('artists').select('*').order('full_name'),
    []
  )

  const { save, saving, saveError, clearError } = useSave(
    async (form) => {
      const { id, ...fields } = form
      return id
        ? supabase.from('artists').update(fields).eq('id', id).select().single()
        : supabase.from('artists').insert(fields).select().single()
    },
    {
      onSuccess: async (savedArtist) => {
        setModalOpen(false)
        refetch()
        showToast()

        // fire-and-forget — don't block the UI if HubSpot sync fails
        const action = editArtist?.id ? 'updated' : 'created'
        syncArtistToHubspot(savedArtist, action).catch(err => {
          console.warn('HubSpot sync failed (non-blocking):', err.message)
        })

        setEditArtist(null)
      }
    }
  )

  const openAdd    = () => { setEditArtist(null); setModalOpen(true) }
  const openEdit   = (artist) => { setEditArtist(artist); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditArtist(null); clearError() }

  const deleteArtist = async (id) => {
    await supabase.from('artists').delete().eq('id', id)
    refetch()
  }

  return (
    <div className="page">
      <ArtistList
        artists={artists || []}
        loading={loading}
        error={error}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={deleteArtist}
      />

      <ArtistModal
        open={modalOpen}
        artist={editArtist}
        onSave={save}
        onClose={closeModal}
        saving={saving}
        saveError={saveError}
        onClearError={clearError}
      />

      {toastVisible && <SaveToast message={editArtist ? 'Artist updated' : 'Artist added'} />}
    </div>
  )
}
