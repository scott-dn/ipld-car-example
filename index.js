// Create a simple .car file with a single block and that block's CID as the
// single root. Then read the .car and fetch the block again.

import fs from 'fs'
import { Readable } from 'stream'
import { CarReader, CarWriter } from '@ipld/car'
import * as raw from 'multiformats/codecs/raw'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'

async function example () {
  const bytes = Buffer.from('random meaningless bytes', 'ascii')
  const hash = await sha256.digest(bytes)
  const cid = CID.create(1, raw.code, hash)

  // create the writer and set the header with a single root
  const root = [CID.create(1, raw.code, sha256.digest(Buffer.from("hello", 'ascii')))];
  const { writer, out } = CarWriter.create(root)
  Readable.from(out).pipe(fs.createWriteStream('example.car'))

  // store a new block, creates a new file entry in the CAR archive
  await writer.put({ cid, bytes })
  await writer.close()

  const inStream = fs.createReadStream('example.car')

  // read and parse the entire stream in one go, this will cache the contents of
  // the car in memory so is not suitable for large files.
  const reader = await CarReader.fromIterable(inStream)
  console.log('reader', reader)

  // read the list of roots from the header
  console.log('roots', await reader.getRoots())

  // retrieve a block, as a { cid:CID, bytes:UInt8Array } pair from the archive
  const got = await reader.get(cid)
  // also possible: for await (const { cid, bytes } of CarIterator.fromIterable(inStream)) { ... }

  console.log('Retrieved [%s] from example.car with CID [%s]',
    new TextDecoder().decode(got.bytes),
    got.cid)
}

example().catch((err) => {
  console.error(err)
  process.exit(1)
})

