import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getGetApiMapQueryKey, usePostApiMap } from '../../api'
import Modal from '../atoms/Modal'
import TextInput from '../atoms/TextInput'
import Button from '../atoms/Button'

export default function AddMap({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [initialCellSize, setInitialCellSize] = useState('70')
  const [image, setImage] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const queryClient = useQueryClient()
  const { mutateAsync: uploadMap, isPending } = usePostApiMap()

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (!title.trim() || !image) {
      setErrorMessage('Enter a map title and select an image.')
      return
    }

    if (!/\.(jpe?g|png|webp)$/i.test(image.name)) {
      setErrorMessage('Select a JPG, PNG, or WebP image.')
      return
    }

    if (image.size === 0 || image.size > 20 * 1024 * 1024) {
      setErrorMessage('Select a non-empty image no larger than 20 MB.')
      return
    }

    const cellSize = Number(initialCellSize)
    if (!Number.isInteger(cellSize) || cellSize <= 0 || cellSize > 2147483647) {
      setErrorMessage('Enter a positive whole-number cell size up to 2147483647.')
      return
    }

    try {
      await uploadMap({
        data: {
          Title: title.trim(),
          InitialCellSize: cellSize,
          image,
        },
      })
      await queryClient.invalidateQueries({ queryKey: getGetApiMapQueryKey() })
      onClose()
    } catch (error: unknown) {
      setErrorMessage(
        isAxiosError(error) && typeof error.response?.data === 'string'
          ? error.response.data
          : error instanceof Error
            ? error.message
            : 'Failed to upload map. Please try again.',
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!isPending) onClose() }}>
      <h2 className="text-xl font-bold mb-4">Add Map</h2>

      {errorMessage && (
        <p role="alert" className="mb-4 p-2 text-sm text-red-700 bg-red-100 rounded border border-red-300">
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <TextInput
          label="Map Title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          disabled={isPending}
          className="mt-1 block w-full rounded-md shadow-sm p-2 text-center"
        />

        <TextInput
          label="Cell Size (px)"
          type="number"
          value={initialCellSize}
          onChange={(event) => setInitialCellSize(event.target.value)}
          min={1}
          max={2147483647}
          step={1}
          required
          disabled={isPending}
          className="mt-1 block w-full rounded-md shadow-sm p-2"
        />

        <label className="block text-sm font-medium">
          Map Image
          <span
            className={`relative mt-1 flex min-h-28 w-full items-center justify-center rounded-md border border-bg-accent transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-special ${
              isPending
                ? 'cursor-not-allowed opacity-60'
                : 'hover:bg-highlight-bg'
            }`}
          >
            <input
              type="file"
              aria-label="Map Image"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              required
              disabled={isPending}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <span className="pointer-events-none flex min-w-0 flex-col items-center gap-2 px-4 py-6 text-center">
              <span className="font-semibold">Choose Image</span>
              <span aria-live="polite" className="max-w-full break-all text-xs">
                {image?.name ?? 'No file selected'}
              </span>
            </span>
          </span>
        </label>

        <div className="flex gap-4 justify-center pt-2">
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? 'Uploading...' : 'Upload Map'}
          </Button>
          <Button type="button" variant="danger" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}