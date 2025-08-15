'use client'

import { useState, useEffect } from 'react'

interface Post {
  time: string
  content: string
  sequence: number
}

interface Progress {
  current_index: number
  deleted_sequences: number[]
}

export default function PostReviewer() {
  const [current_post, set_current_post] = useState<Post | null>(null)
  const [progress, set_progress] = useState<Progress>({ current_index: 0, deleted_sequences: [] })
  const [all_posts, set_all_posts] = useState<Post[]>([])
  const [loading, set_loading] = useState(true)

  useEffect(() => {
    load_posts()
    load_progress()
  }, [])

  const load_posts = async () => {
    try {
      const response = await fetch('/wangxing_posts.json')
      const posts = await response.json()
      set_all_posts(posts)
      
      const saved_progress = get_saved_progress()
      load_current_post(posts, saved_progress.current_index)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      set_loading(false)
    }
  }

  const get_saved_progress = (): Progress => {
    const saved_progress = localStorage.getItem('post_review_progress')
    if (saved_progress) {
      return JSON.parse(saved_progress)
    }
    return { current_index: 0, deleted_sequences: [] }
  }

  const load_progress = () => {
    const saved_progress = get_saved_progress()
    set_progress(saved_progress)
  }

  const save_progress = (new_progress: Progress) => {
    localStorage.setItem('post_review_progress', JSON.stringify(new_progress))
    set_progress(new_progress)
  }

  const load_current_post = (posts: Post[], index: number) => {
    if (index < posts.length) {
      set_current_post(posts[index])
    } else {
      set_current_post(null)
    }
  }

  const handle_useful = () => {
    const new_index = progress.current_index + 1
    const new_progress = { ...progress, current_index: new_index }
    save_progress(new_progress)
    load_current_post(all_posts, new_index)
  }

  const handle_useless = async () => {
    if (!current_post) return

    const new_deleted = [...progress.deleted_sequences, current_post.sequence]
    const new_index = progress.current_index + 1
    const new_progress = { 
      current_index: new_index, 
      deleted_sequences: new_deleted 
    }

    await delete_post_from_file(current_post.sequence)
    save_progress(new_progress)
    
    const updated_posts = all_posts.filter(post => post.sequence !== current_post.sequence)
    set_all_posts(updated_posts)
    load_current_post(updated_posts, new_index - 1)
  }

  const delete_post_from_file = async (sequence: number) => {
    try {
      await fetch('/api/delete-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence })
      })
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-2xl text-white">加载中...</div>
      </div>
    )
  }

  if (!current_post) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">完成!</h2>
          <p className="text-xl text-white mb-4">所有内容已审查完毕</p>
          <p className="mt-4 text-gray-300 text-lg">
            删除了 {progress.deleted_sequences.length} 条内容
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('post_review_progress')
              window.location.reload()
            }}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-xl font-bold"
          >
            重新开始
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-xl text-center">
          <h1 className="text-3xl font-bold">序号: {current_post.sequence}</h1>
          <p className="text-lg opacity-90 mt-2">
            进度: {progress.current_index + 1} / {all_posts.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-6">
            <p className="text-lg text-gray-300 mb-4">{current_post.time}</p>
            <div className="text-xl leading-relaxed max-h-80 overflow-y-auto text-white">
              {current_post.content}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-6 flex gap-4">
          <button
            onClick={handle_useless}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-8 px-8 rounded-xl text-2xl font-bold transition-colors active:bg-red-800 shadow-lg"
          >
            删除
          </button>
          <button
            onClick={handle_useful}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-8 px-8 rounded-xl text-2xl font-bold transition-colors active:bg-green-800 shadow-lg"
          >
            留着
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-6">
          <div className="w-full bg-gray-600 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((progress.current_index + 1) / all_posts.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-lg text-gray-300 mt-3 text-center">
            已删除 {progress.deleted_sequences.length} 条
          </p>
        </div>
      </div>
    </div>
  )
}