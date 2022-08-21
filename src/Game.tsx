import {MouseEvent, useCallback, useEffect, useRef, useState} from 'react'
import './Game.scss'

type Missile = {
  id: number
  x0: number
  y0: number
  x: number
  y: number
  vx: number
  vy: number
  collided: number
  blast: number
}

type Blast = {
  x: number
  y: number
  r: number
  e: boolean
}

function hasCollided(x: number, y: number, blasts: Blast[]) {
  for (const blast of blasts) {
    if (Math.sqrt(Math.pow(blast.x - x, 2) + Math.pow(blast.y - y, 2)) < blast.r) {
      return true
    }
  }
  if (x < 200 || x > 3640 || x > 600 && x < 3240) {
    return y >= 2060
  }
  if (x > 200 && x < 400) {
    return y >= 2060 - (x - 200)
  }
  if (x >= 400 && x < 600) {
    return y >= 2060 - (600 - x)
  }
  if (x > 3240 && x < 3440) {
    return y >= 2060 - (x - 3240)
  }
  if (x >= 3440 && x < 3640) {
    return y >= 2060 - (3640 - x)
  }
  return false
}

const timeOrigin = Date.now()
let missileCounter = 0

function createMissile() {
  let x0 = Math.random() * 3840
  let y0 = 0
  return {
    id: missileCounter++,
    x0,
    y0,
    x: x0,
    y: y0,
    vx: (-1 + Math.random() * 2) * 1.5,
    vy: (1 + Math.random()) * 3,
    collided: 0,
    blast: 0
  }
}

function Game() {

  const [state, setState] = useState<{
    missiles: Missile[]
    blasts: Blast[]
  }>(() => {
    const missiles: Missile[] = []
    for (let i = 0; i < 5; i++) {
      missiles.push(createMissile())
    }
    return {missiles, blasts: []}
  })

  useEffect(() => {
    const now = (Date.now() - timeOrigin) / 1000

    const blasts = state.blasts.map(({x, y, r, e}) => {
      if (e) {
        r += 10
        return {
          x,
          y,
          r,
          e: r < 300
        }
      } else {
        r -= 10
        return {
          x,
          y,
          r,
          e: false
        }
      }
    }).filter(blast => blast.e || blast.r > 0)

    const missiles = state.missiles.map((missile) => {
      if (missile.collided) {
        return missile
      } else {
        let x = missile.x + missile.vx
        let y = missile.y + missile.vy
        if (hasCollided(x, y, blasts)) {
          return {
            ...missile,
            x,
            y,
            collided: now,
            blast: Math.random() * 300
          }
        } else {
          return {
            ...missile,
            x,
            y
          }
        }
      }
    }).filter(missile => !missile.collided || now - missile.collided < .5)

    if (Math.random() > .99) {
      missiles.push(createMissile())
    }

    requestAnimationFrame(() => {
      setState({missiles, blasts})
    })

  }, [state])

  const svgPt = useRef<(e: MouseEvent<SVGSVGElement>) => { x: number, y: number }>()

  const {missiles, blasts} = state
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="Game" width="100%" viewBox="0 0 3840 2160"
         ref={svg => {
           if (!svg) {
             return
           }
           const pt = svg!.createSVGPoint()
           svgPt.current = function (evt) {
             const {clientX, clientY} = evt.nativeEvent
             pt.x = clientX
             pt.y = clientY
             const {x, y} = pt.matrixTransform(svg!.getScreenCTM()!.inverse())
             return {x, y}
           }
         }}
         onClick={e => {
           setState({
             missiles,
             blasts: [...blasts, {...svgPt.current!(e), r: 10, e: true}]
           })
         }}>
      <g>
        {blasts.map(({x, y, r}, index) => (
          <circle key={index} className="blast" cx={x} cy={y} r={r}/>
        ))}
      </g>
      {missiles.map(({id, x0, y0, x, y, collided, blast}, index) => (
        <g key={id} data-index={index} data-id={id}>
          <line className="stream" x1={x0} x2={x} y1={y0} y2={y}/>
          <circle className="missile" cx={x} cy={y} r="10">
            {collided &&
            <animate attributeName="r" begin={collided + 's'} dur=".5s" values={`10;${blast};10`} fill="freeze"/>}
          </circle>
        </g>
      ))}
      <polyline className="terrain"
                points="-10,2160 0,2060 200,2060 400,1860 600,2060 3240,2060 3440,1860 3640,2060 3840,2060 3850,2160"/>
    </svg>
  )
}

export default Game
