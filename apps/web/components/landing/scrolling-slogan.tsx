'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

interface SloganProps {
    slogan: {
        text: string
        language: string
    }
    index: number
}

export default function ScrollingSlogan({ slogan, index }: SloganProps) {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    const variants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0 },
    }

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={variants}
            transition={{ duration: 0.5, delay: index * 0.2 }}
        >
            <h2 className="text-2xl font-semibold mb-2">{slogan.language}</h2>
            <p className="text-lg">{slogan.text}</p>
        </motion.div>
    )
}

