// API endpoint for deleting posts
// This should be placed in fanfou/app/api/delete-post/route.ts

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { sequence } = await request.json()
    
    const file_path = path.join(process.cwd(), 'public', 'wangxing_posts.json')
    const file_content = await fs.readFile(file_path, 'utf-8')
    const posts = JSON.parse(file_content)
    
    // Filter out the post with matching sequence
    const filtered_posts = posts.filter((post: { sequence: number }) => post.sequence !== sequence)
    
    // Write back to file
    await fs.writeFile(file_path, JSON.stringify(filtered_posts, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      message: `Post with sequence ${sequence} deleted`,
      remaining_count: filtered_posts.length
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ 
      error: 'Failed to delete post',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}